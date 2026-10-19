using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

public sealed class PersonalNoteConflictException : Exception { }

public class PersonalNoteService(AppDbContext db)
{
    private record Cursor(string Owner, string Query, DateTime At, string Id);
    private static string Owner(ClaimsPrincipal user) => user.Identity?.IsAuthenticated == true
        && user.FindFirstValue(ClaimTypes.NameIdentifier) is { Length: > 0 } id ? id : throw new UnauthorizedAccessException();
    private IQueryable<PersonalNoteModel> Owned(ClaimsPrincipal user)
    {
        var owner = Owner(user);
        return db.PersonalNote.AsNoTracking().Where(n => n.OwnerId == owner);
    }

    public async Task<CursorPageInfo<PersonalNoteSummaryDto>> List(ClaimsPrincipal user, string? keyword, int pageSize, string? cursor)
    {
        var owner = Owner(user);
        var term = (keyword ?? "").Trim().ToLowerInvariant();
        if (term.Length > 200) throw new ArgumentException("Invalid keyword");
        Cursor? before = null;
        if (!string.IsNullOrEmpty(cursor))
        {
            if (cursor.Length > 2048) throw new ArgumentException("Invalid cursor");
            try { before = JsonSerializer.Deserialize<Cursor>(Convert.FromBase64String(cursor)); }
            catch (Exception ex) when (ex is JsonException or FormatException) { throw new ArgumentException("Invalid cursor"); }
            if (before == null || before.Owner != owner || before.Query != term || before.At.Kind != DateTimeKind.Utc
                || string.IsNullOrEmpty(before.Id)) throw new ArgumentException("Invalid cursor");
        }
        var query = Owned(user);
        if (term.Length > 0) query = query.Where(n => n.Title.ToLower().Contains(term) || n.ContentText.ToLower().Contains(term));
        if (before != null) query = query.Where(n => n.UpdatedAt < before.At
            || (n.UpdatedAt == before.At && string.Compare(n.NoteId, before.Id) < 0));
        int take = Math.Clamp(pageSize, 1, 30);
        var rows = await query.OrderByDescending(n => n.UpdatedAt).ThenByDescending(n => n.NoteId)
            .Select(n => new PersonalNoteSummaryDto
            {
                NoteId = n.NoteId, Title = n.Title, Version = n.Version, CreatedAt = n.CreatedAt, UpdatedAt = n.UpdatedAt,
                Preview = n.ContentText.Length > 160 ? n.ContentText.Substring(0, 160) : n.ContentText,
            }).Take(take + 1).ToListAsync();
        bool more = rows.Count > take;
        rows = rows.Take(take).ToList();
        return new CursorPageInfo<PersonalNoteSummaryDto>
        {
            DataList = rows, HasMore = more,
            NextCursor = more ? Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(new Cursor(owner, term,
                DateTime.SpecifyKind(rows.Last().UpdatedAt, DateTimeKind.Utc), rows.Last().NoteId))) : null!,
        };
    }

    public async Task<PersonalNoteDto?> Get(ClaimsPrincipal user, string id)
    {
        var note = await Owned(user).FirstOrDefaultAsync(n => n.NoteId == id);
        return note == null ? null : Detail(note);
    }

    public Task<PersonalNoteDto?> Save(ClaimsPrincipal user, string id, PersonalNoteSaveDto data)
        => SaveDocument(user, id, data, publish: false);

    public Task<PersonalNoteDto?> Publish(ClaimsPrincipal user, string id, PersonalNoteSaveDto data, bool allowEditing = false)
        => SaveDocument(user, id, data, publish: true, allowEditing);

    // Publishing and shared edits are atomic. While an edit link is active,
    // owner saves also update the shared view. View-only publications keep their snapshot.
    private async Task<PersonalNoteDto?> SaveDocument(ClaimsPrincipal user, string id, PersonalNoteSaveDto data, bool publish, bool allowEditing = false)
    {
        var owner = Owner(user);
        if (!Guid.TryParseExact(id, "D", out _) || data.Version < 0 || data.Version == int.MaxValue
            || string.IsNullOrWhiteSpace(data.Title) || data.Title.Trim().Length > 200)
            throw new ArgumentException("Invalid note");
        var title = data.Title.Trim();
        var text = PersonalNoteDocument.Text(data.ContentJson);
        var now = DateTime.UtcNow;
        var token = publish ? Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant() : null;
        var editToken = publish && allowEditing ? Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant() : null;
        if (data.Version == 0)
        {
            // Client-generated IDs make retrying a lost create response idempotent.
            var existing = await Owned(user).FirstOrDefaultAsync(n => n.NoteId == id);
            if (existing != null)
            {
                if (existing.Title == title && existing.ContentJson == data.ContentJson
                    && (!publish || (existing.PublicToken != null && existing.PublishedTitle == title && existing.PublishedContentJson == data.ContentJson
                        && (existing.EditToken != null) == allowEditing))) return Detail(existing);
                throw new PersonalNoteConflictException();
            }
            if (await db.PersonalNote.AnyAsync(n => n.NoteId == id)) throw new PersonalNoteConflictException();
            var created = new PersonalNoteModel
            {
                NoteId = id, OwnerId = owner, Title = title, ContentJson = data.ContentJson, ContentText = text,
                CreatedAt = now, UpdatedAt = now, Version = 1,
                PublicToken = token, PublishedTitle = publish ? title : null,
                PublishedContentJson = publish ? data.ContentJson : null, PublishedAt = publish ? now : null,
                EditToken = editToken,
            };
            db.PersonalNote.Add(created);
            try { await db.SaveChangesAsync(); }
            catch (DbUpdateException)
            {
                db.Entry(created).State = EntityState.Detached;
                var retry = await Owned(user).FirstOrDefaultAsync(n => n.NoteId == id);
                if (retry != null && retry.Title == title && retry.ContentJson == data.ContentJson
                    && (!publish || (retry.PublicToken != null && retry.PublishedTitle == title && retry.PublishedContentJson == data.ContentJson
                        && (retry.EditToken != null) == allowEditing))) return Detail(retry);
                throw new PersonalNoteConflictException();
            }
            return Detail(created);
        }
        int changed = await Owned(user).Where(n => n.NoteId == id && n.Version == data.Version)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Title, title)
                .SetProperty(n => n.ContentJson, data.ContentJson).SetProperty(n => n.ContentText, text)
                .SetProperty(n => n.PublicToken, n => publish ? n.PublicToken ?? token : n.PublicToken)
                .SetProperty(n => n.PublishedTitle, n => publish || n.EditToken != null ? title : n.PublishedTitle)
                .SetProperty(n => n.PublishedContentJson, n => publish || n.EditToken != null ? data.ContentJson : n.PublishedContentJson)
                .SetProperty(n => n.PublishedAt, n => publish || n.EditToken != null ? now : n.PublishedAt)
                .SetProperty(n => n.EditToken, n => publish ? (allowEditing ? n.EditToken ?? editToken : null) : n.EditToken)
                .SetProperty(n => n.UpdatedAt, now).SetProperty(n => n.Version, n => n.Version + 1));
        if (changed == 0 && await Owned(user).AnyAsync(n => n.NoteId == id)) throw new PersonalNoteConflictException();
        return changed == 0 ? null : await Get(user, id);
    }

    public async Task<bool> Delete(ClaimsPrincipal user, string id, int version)
    {
        if (version < 1) throw new ArgumentException("Invalid version");
        int changed = await Owned(user).Where(n => n.NoteId == id && n.Version == version).ExecuteDeleteAsync();
        if (changed == 0 && await Owned(user).AnyAsync(n => n.NoteId == id)) throw new PersonalNoteConflictException();
        return changed > 0;
    }

    public async Task<PersonalNoteDto?> Unpublish(ClaimsPrincipal user, string id, int version)
    {
        if (version < 1 || version == int.MaxValue) throw new ArgumentException("Invalid version");
        int changed = await Owned(user).Where(n => n.NoteId == id && n.Version == version)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.PublicToken, (string?)null)
                .SetProperty(n => n.EditToken, (string?)null)
                .SetProperty(n => n.PublishedTitle, (string?)null).SetProperty(n => n.PublishedContentJson, (string?)null)
                .SetProperty(n => n.PublishedAt, (DateTime?)null).SetProperty(n => n.Version, n => n.Version + 1));
        if (changed == 0 && await Owned(user).AnyAsync(n => n.NoteId == id)) throw new PersonalNoteConflictException();
        return changed == 0 ? null : await Get(user, id);
    }

    // Revoking edit access does not replace the public snapshot or affect the view link.
    public async Task<PersonalNoteDto?> RevokeEditing(ClaimsPrincipal user, string id, int version)
    {
        if (version < 1 || version == int.MaxValue) throw new ArgumentException("Invalid version");
        int changed = await Owned(user).Where(n => n.NoteId == id && n.Version == version)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.EditToken, (string?)null).SetProperty(n => n.Version, n => n.Version + 1));
        if (changed == 0 && await Owned(user).AnyAsync(n => n.NoteId == id)) throw new PersonalNoteConflictException();
        return changed == 0 ? null : await Get(user, id);
    }

    private IQueryable<PersonalNoteModel> Editable(string token) => db.PersonalNote.AsNoTracking()
        .Where(n => n.EditToken == token && n.PublicToken != null && n.PublishedAt != null
            && n.PublishedTitle != null && n.PublishedContentJson != null);

    public async Task<SharedPersonalNoteDto?> Shared(string token)
    {
        if (!ValidToken(token)) return null;
        return await Editable(token).Select(n => new SharedPersonalNoteDto {
            Title = n.Title, ContentJson = n.ContentJson, Version = n.Version
        }).SingleOrDefaultAsync();
    }

    public async Task<SharedPersonalNoteDto?> SaveShared(string token, PersonalNoteSaveDto data)
    {
        if (!ValidToken(token)) return null;
        if (data.Version < 1 || data.Version == int.MaxValue || string.IsNullOrWhiteSpace(data.Title) || data.Title.Trim().Length > 200)
            throw new ArgumentException("Invalid note");
        var text = PersonalNoteDocument.Text(data.ContentJson);
        var title = data.Title.Trim();
        var now = DateTime.UtcNow;
        int changed = await Editable(token).Where(n => n.Version == data.Version)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Title, title).SetProperty(n => n.ContentJson, data.ContentJson)
                .SetProperty(n => n.ContentText, text).SetProperty(n => n.UpdatedAt, now)
                .SetProperty(n => n.PublishedTitle, title).SetProperty(n => n.PublishedContentJson, data.ContentJson)
                .SetProperty(n => n.PublishedAt, now).SetProperty(n => n.Version, n => n.Version + 1));
        if (changed == 0 && await Editable(token).AnyAsync()) throw new PersonalNoteConflictException();
        // Return the exact version this request saved, even if another editor saves immediately afterwards.
        return changed == 0 ? null : new SharedPersonalNoteDto { Title = title, ContentJson = data.ContentJson, Version = data.Version + 1 };
    }

    private static bool ValidToken(string token) => token.Length == 64 && token.All(char.IsAsciiHexDigit);

    public async Task<PublicPersonalNoteDto?> Public(string token)
    {
        if (!ValidToken(token)) return null;
        return await db.PersonalNote.AsNoTracking()
            .Where(n => n.PublicToken == token && n.PublishedTitle != null && n.PublishedContentJson != null && n.PublishedAt != null)
            .Select(n => new PublicPersonalNoteDto { Title = n.PublishedTitle!, ContentJson = n.PublishedContentJson! })
            .SingleOrDefaultAsync();
    }

    private static PersonalNoteDto Detail(PersonalNoteModel note) => new()
    {
        NoteId = note.NoteId, Title = note.Title, ContentJson = note.ContentJson, Version = note.Version,
        CreatedAt = note.CreatedAt, UpdatedAt = note.UpdatedAt,
        PublicToken = note.PublicToken, PublishedAt = note.PublishedAt, EditToken = note.EditToken,
        Preview = note.ContentText.Length > 160 ? note.ContentText[..160] : note.ContentText,
    };
}
