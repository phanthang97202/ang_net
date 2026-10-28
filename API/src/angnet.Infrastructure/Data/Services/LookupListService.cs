using System.Text.RegularExpressions;
using angnet.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services;

public static class LookupListCodes
{
    public const string CalendarCategory = "CALENDAR_CATEGORY";
    public const string CalendarStatus = "CALENDAR_STATUS";
    public const string ExpenseCategory = "EXPENSE_CATEGORY";
    public static readonly string[] All = [CalendarCategory, CalendarStatus, ExpenseCategory];

    /// <summary>Quyền cần có để xem / sửa từng danh sách (quyền của module dùng danh sách đó).</summary>
    public static string? Permission(string listCode) => listCode switch
    {
        CalendarCategory or CalendarStatus => "calendar.use",
        ExpenseCategory => "expenses.use",
        _ => null,
    };
}

public record LookupDefault(string Code, string NameVi, string NameEn, string Color, string Kind = "");

/// <summary>
/// Bộ mục mặc định chép cho từng người dùng ở lần đầu dùng danh sách. Code của mục
/// mặc định trùng giá trị các module đã lưu trước khi có LookupList, nên dữ liệu cũ
/// không phải chuyển đổi (script 0075 chép sẵn cho người đã có dữ liệu).
/// </summary>
public static class LookupDefaults
{
    public static readonly IReadOnlyDictionary<string, LookupDefault[]> Lists = new Dictionary<string, LookupDefault[]>
    {
        [LookupListCodes.CalendarCategory] =
        [
            new("personal", "Cá nhân", "Personal", "#7661d8"),
            new("leisure", "Đi chơi", "Going out", "#d0764a"),
            new("routine", "Sinh hoạt", "Daily routine", "#3b9d86"),
            new("work", "Công việc", "Work", "#4d87c2"),
        ],
        // done / cancelled / urgent còn được giao diện lịch hiểu thêm (✓, gạch ngang, !)
        // nhưng vẫn xóa / đổi tên được như mọi mục khác
        [LookupListCodes.CalendarStatus] =
        [
            new("todo", "Cần làm", "To do", "#6b6b7b"),
            new("in_progress", "Đang làm", "In progress", "#2f6fd6"),
            new("urgent", "Khẩn cấp", "Urgent", "#d33a42"),
            new("done", "Đã hoàn thành", "Done", "#23855c"),
            new("cancelled", "Hủy bỏ", "Cancelled", "#8a8a99"),
        ],
        [LookupListCodes.ExpenseCategory] =
        [
            new("salary", "Lương", "Salary", "#23855c", "income"),
            new("other_income", "Thu nhập khác", "Other income", "#3b9d86", "income"),
            new("food", "Ăn uống", "Food & drinks", "#d0764a", "expense"),
            new("transport", "Đi lại", "Transport", "#4d87c2", "expense"),
            new("shopping", "Mua sắm", "Shopping", "#c2417a", "expense"),
            new("bills", "Hóa đơn", "Bills", "#b7791f", "expense"),
            new("housing", "Nhà ở", "Housing", "#7661d8", "expense"),
            new("entertainment", "Giải trí", "Entertainment", "#2f9fb3", "expense"),
            new("health", "Sức khỏe", "Health", "#d33a42", "expense"),
            new("other", "Khác", "Other", "#6b6b7b", "both"),
        ],
    };
}

public class LookupItemRequest
{
    public string NameVi { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string Color { get; set; } = "";
    public string Kind { get; set; } = "";
    public bool FlagActive { get; set; } = true;
}

public enum LookupResult { Ok, NotFound, Invalid, Limit, Deleted, Hidden }

/*
    Danh sách chọn của từng người dùng (bảng LookupList dùng chung cho mọi module).
    Mọi thao tác lọc theo OwnerId của người đang đăng nhập; controller kiểm tra thêm
    quyền module của danh sách. Viết thuần EF (không SQL riêng của Postgres) để test
    SQLite chạy được.
*/
public class LookupListService(AppDbContext db, TimeProvider clock)
{
    private const int MaxItemsPerList = 100;
    private const int NameMaxLength = 80;
    private static readonly Regex ColorPattern = new("^#[0-9a-fA-F]{6}$", RegexOptions.Compiled);
    private static readonly string[] Kinds = ["income", "expense", "both"];

    public static bool IsListCode(string? listCode) => listCode != null && LookupListCodes.All.Contains(listCode);

    /// <summary>Mục của danh sách, xếp theo thứ tự hiển thị. Lần đầu dùng thì chép bộ mặc định.</summary>
    public async Task<List<LookupListModel>> ListAsync(string owner, string listCode, bool includeInactive, CancellationToken ct)
    {
        await EnsureSeededAsync(owner, listCode, ct);
        return await db.LookupList.AsNoTracking()
            .Where(x => x.OwnerId == owner && x.ListCode == listCode && (includeInactive || x.FlagActive))
            .OrderBy(x => x.SortOrder).ThenBy(x => x.CreatedAt).ThenBy(x => x.Code)
            .ToListAsync(ct);
    }

    /// <summary>
    /// Mục dùng được khi lưu dữ liệu: đang bật, hoặc chính là giá trị hiện tại của bản
    /// ghi đang sửa (để sửa sự kiện có loại đã bị ẩn không bị báo lỗi).
    /// </summary>
    public async Task<LookupListModel?> FindUsableAsync(string owner, string listCode, string? code, string? currentCode, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(code)) return null;
        await EnsureSeededAsync(owner, listCode, ct);
        var item = await db.LookupList.AsNoTracking()
            .SingleOrDefaultAsync(x => x.OwnerId == owner && x.ListCode == listCode && x.Code == code, ct);
        return item != null && (item.FlagActive || item.Code == currentCode) ? item : null;
    }

    public Task<LookupListModel?> FindAsync(string owner, string id, CancellationToken ct) =>
        db.LookupList.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner, ct);

    /// <summary>Mã đang được dữ liệu của người này dùng (không xóa hẳn được, chỉ ẩn).</summary>
    public async Task<HashSet<string>> CodesInUseAsync(string owner, string listCode, CancellationToken ct)
    {
        List<string> codes = listCode switch
        {
            LookupListCodes.CalendarCategory => await db.PersonalCalendarEvent.Where(x => x.OwnerId == owner)
                .Select(x => x.Category).Distinct().ToListAsync(ct),
            LookupListCodes.CalendarStatus => await db.PersonalCalendarEvent.Where(x => x.OwnerId == owner).Select(x => x.Status)
                .Union(db.PersonalCalendarOccurrenceStatus
                    .Where(s => db.PersonalCalendarEvent.Any(e => e.EventId == s.EventId && e.OwnerId == owner))
                    .Select(s => s.Status))
                .Distinct().ToListAsync(ct),
            LookupListCodes.ExpenseCategory => await db.PersonalExpense.Where(x => x.OwnerId == owner)
                .Select(x => x.CategoryCode).Distinct().ToListAsync(ct),
            _ => [],
        };
        return codes.ToHashSet(StringComparer.Ordinal);
    }

    public async Task<(LookupResult Result, LookupListModel? Item)> CreateAsync(string owner, string listCode, LookupItemRequest request, CancellationToken ct)
    {
        if (!Normalize(listCode, request)) return (LookupResult.Invalid, null);
        await EnsureSeededAsync(owner, listCode, ct);
        var items = db.LookupList.Where(x => x.OwnerId == owner && x.ListCode == listCode);
        if (await items.CountAsync(ct) >= MaxItemsPerList) return (LookupResult.Limit, null);

        var now = clock.GetUtcNow().UtcDateTime;
        var item = new LookupListModel
        {
            Id = Guid.NewGuid().ToString(),
            OwnerId = owner,
            ListCode = listCode,
            // Mã ngẫu nhiên, ngắn (vừa varchar(16)), không phụ thuộc tên để đổi tên thoải mái
            Code = "c" + Guid.NewGuid().ToString("N")[..10],
            SortOrder = (await items.MaxAsync(x => (int?)x.SortOrder, ct) ?? -1) + 1,
            CreatedAt = now,
            UpdatedAt = now,
        };
        Apply(item, request);
        db.LookupList.Add(item);
        await db.SaveChangesAsync(ct);
        return (LookupResult.Ok, item);
    }

    public async Task<(LookupResult Result, LookupListModel? Item)> UpdateAsync(string owner, string id, LookupItemRequest request, CancellationToken ct)
    {
        var item = await db.LookupList.SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner, ct);
        if (item == null) return (LookupResult.NotFound, null);
        if (!Normalize(item.ListCode, request)) return (LookupResult.Invalid, null);
        Apply(item, request);
        item.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync(ct);
        return (LookupResult.Ok, item);
    }

    /// <summary>Chưa dùng thì xóa hẳn; đã có dữ liệu dùng thì chỉ ẩn để dữ liệu cũ vẫn hiện đúng tên.</summary>
    public async Task<LookupResult> DeleteAsync(string owner, string id, CancellationToken ct)
    {
        var item = await db.LookupList.SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner, ct);
        if (item == null) return LookupResult.NotFound;
        if ((await CodesInUseAsync(owner, item.ListCode, ct)).Contains(item.Code))
        {
            item.FlagActive = false;
            item.UpdatedAt = clock.GetUtcNow().UtcDateTime;
            await db.SaveChangesAsync(ct);
            return LookupResult.Hidden;
        }
        db.LookupList.Remove(item);
        await db.SaveChangesAsync(ct);
        return LookupResult.Deleted;
    }

    /// <summary>Dời một mục lên / xuống một bậc trong danh sách của nó.</summary>
    public async Task<LookupResult> MoveAsync(string owner, string id, string? direction, CancellationToken ct)
    {
        if (direction is not ("up" or "down")) return LookupResult.Invalid;
        var current = await db.LookupList.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner, ct);
        if (current == null) return LookupResult.NotFound;
        var items = await db.LookupList.Where(x => x.OwnerId == owner && x.ListCode == current.ListCode)
            .OrderBy(x => x.SortOrder).ThenBy(x => x.CreatedAt).ThenBy(x => x.Code).ToListAsync(ct);
        var from = items.FindIndex(x => x.Id == id);
        var to = direction == "up" ? from - 1 : from + 1;
        if (to < 0 || to >= items.Count) return LookupResult.Invalid;
        (items[from], items[to]) = (items[to], items[from]);
        // Đánh số lại liền mạch: dữ liệu cũ có thể trùng SortOrder
        for (var index = 0; index < items.Count; index++) items[index].SortOrder = index;
        await db.SaveChangesAsync(ct);
        return LookupResult.Ok;
    }

    private async Task EnsureSeededAsync(string owner, string listCode, CancellationToken ct)
    {
        if (await db.LookupList.AnyAsync(x => x.OwnerId == owner && x.ListCode == listCode, ct)) return;
        var now = clock.GetUtcNow().UtcDateTime;
        var defaults = LookupDefaults.Lists[listCode];
        var rows = defaults.Select((item, index) => new LookupListModel
        {
            Id = Guid.NewGuid().ToString(),
            OwnerId = owner,
            ListCode = listCode,
            Code = item.Code,
            NameVi = item.NameVi,
            NameEn = item.NameEn,
            Color = item.Color,
            Kind = item.Kind,
            SortOrder = index,
            CreatedAt = now,
            UpdatedAt = now,
        }).ToList();
        db.LookupList.AddRange(rows);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Hai request đầu tiên cùng lúc: request kia đã chép xong, bỏ bản của mình
            foreach (var row in rows) db.Entry(row).State = EntityState.Detached;
        }
    }

    // Tên: ít nhất một thứ tiếng, thiếu bên nào thì lấy bên kia. Màu #rrggbb. Kind chỉ
    // dành cho danh mục thu chi (mặc định "both").
    private static bool Normalize(string listCode, LookupItemRequest request)
    {
        request.NameVi = (request.NameVi ?? "").Trim();
        request.NameEn = (request.NameEn ?? "").Trim();
        if (request.NameVi.Length == 0) request.NameVi = request.NameEn;
        if (request.NameEn.Length == 0) request.NameEn = request.NameVi;
        if (request.NameVi.Length is 0 or > NameMaxLength || request.NameEn.Length > NameMaxLength) return false;

        request.Color = (request.Color ?? "").Trim().ToLowerInvariant();
        if (request.Color.Length == 0) request.Color = "#6b6b7b";
        if (!ColorPattern.IsMatch(request.Color)) return false;

        if (listCode == LookupListCodes.ExpenseCategory)
        {
            request.Kind = string.IsNullOrWhiteSpace(request.Kind) ? "both" : request.Kind.Trim().ToLowerInvariant();
            return Kinds.Contains(request.Kind);
        }
        request.Kind = "";
        return true;
    }

    private static void Apply(LookupListModel item, LookupItemRequest request)
    {
        item.NameVi = request.NameVi;
        item.NameEn = request.NameEn;
        item.Color = request.Color;
        item.Kind = request.Kind;
        item.FlagActive = request.FlagActive;
    }
}
