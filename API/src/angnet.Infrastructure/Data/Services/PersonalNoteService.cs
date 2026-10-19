using System.Security.Claims;
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

    public async Task<PersonalNoteDto?> Save(ClaimsPrincipal user, string id, PersonalNoteSaveDto data)
    {
        var owner = Owner(user);
        if (!Guid.TryParseExact(id, "D", out _) || data.Version < 0 || data.Version == int.MaxValue
            || string.IsNullOrWhiteSpace(data.Title) || data.Title.Trim().Length > 200)
            throw new ArgumentException("Invalid note");
        var title = data.Title.Trim();
        var text = PersonalNoteDocument.Text(data.ContentJson);
        var now = DateTime.UtcNow;
        if (data.Version == 0)
        {
            // Client-generated IDs make retrying a lost create response idempotent.
            var existing = await Owned(user).FirstOrDefaultAsync(n => n.NoteId == id);
            if (existing != null)
            {
                if (existing.Title == title && existing.ContentJson == data.ContentJson) return Detail(existing);
                throw new PersonalNoteConflictException();
            }
            if (await db.PersonalNote.AnyAsync(n => n.NoteId == id)) throw new PersonalNoteConflictException();
            var created = new PersonalNoteModel
            {
                NoteId = id, OwnerId = owner, Title = title, ContentJson = data.ContentJson, ContentText = text,
                CreatedAt = now, UpdatedAt = now, Version = 1,
            };
            db.PersonalNote.Add(created);
            try { await db.SaveChangesAsync(); }
            catch (DbUpdateException)
            {
                db.Entry(created).State = EntityState.Detached;
                var retry = await Owned(user).FirstOrDefaultAsync(n => n.NoteId == id);
                if (retry != null && retry.Title == title && retry.ContentJson == data.ContentJson) return Detail(retry);
                throw new PersonalNoteConflictException();
            }
            return Detail(created);
        }
        int changed = await Owned(user).Where(n => n.NoteId == id && n.Version == data.Version)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Title, title)
                .SetProperty(n => n.ContentJson, data.ContentJson).SetProperty(n => n.ContentText, text)
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

    private static PersonalNoteDto Detail(PersonalNoteModel note) => new()
    {
        NoteId = note.NoteId, Title = note.Title, ContentJson = note.ContentJson, Version = note.Version,
        CreatedAt = note.CreatedAt, UpdatedAt = note.UpdatedAt,
        Preview = note.ContentText.Length > 160 ? note.ContentText[..160] : note.ContentText,
    };
}
