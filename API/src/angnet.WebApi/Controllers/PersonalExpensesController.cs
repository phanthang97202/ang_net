using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Security.Claims;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace angnet.WebApi.Controllers;

public class PersonalExpenseRequest
{
    [Required, MaxLength(8)] public string Type { get; set; } = "";
    public long Amount { get; set; }
    [Required] public string Date { get; set; } = "";
    // Code của danh mục trong LookupList (EXPENSE_CATEGORY) của chính người dùng
    [Required, MaxLength(16)] public string CategoryCode { get; set; } = "";
    [MaxLength(500)] public string Note { get; set; } = "";
    public int Version { get; set; }
}

[ApiController, Route("api/PersonalExpenses"), Authorize(Policy = "expenses.use"), EnableRateLimiting("API")]
// Danh mục là danh sách riêng của từng người (LookupList, quản lý ở trang cá nhân);
// giao dịch lưu CategoryCode, kèm bản chụp tên ở cột Category.
public class PersonalExpensesController(AppDbContext db, TimeProvider clock, LookupListService lookups) : ControllerBase
{
    private string? OwnerId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> List(string? month, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!DateOnly.TryParseExact(month + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var first)) return BadRequest(new { Code = "InvalidMonth" });
        var last = first.AddDays(DateTime.DaysInMonth(first.Year, first.Month) - 1);
        var items = await db.PersonalExpense.AsNoTracking().Where(x => x.OwnerId == owner && x.Date >= first && x.Date <= last)
            .OrderByDescending(x => x.Date).ThenByDescending(x => x.CreatedAt).ThenBy(x => x.Id).ToListAsync(ct);
        return Ok(items.Select(Response));
    }
    [HttpPost, RequestSizeLimit(4096)]
    public async Task<IActionResult> Create(PersonalExpenseRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (await Category(request, owner, null, ct) is not { } category) return BadRequest(new { Code = "InvalidTransaction" });
        var now = clock.GetUtcNow().UtcDateTime;
        var item = new PersonalExpenseModel { Id = Guid.NewGuid().ToString(), OwnerId = owner, CreatedAt = now, UpdatedAt = now };
        Apply(item, request, category); db.PersonalExpense.Add(item); await db.SaveChangesAsync(ct);
        return Ok(Response(item));
    }
    [HttpPut("{id}"), RequestSizeLimit(4096)]
    public async Task<IActionResult> Update(string id, PersonalExpenseRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Guid.TryParse(id, out _) || request.Version < 1 || request.Version == int.MaxValue) return BadRequest(new { Code = "InvalidTransaction" });
        var item = await db.PersonalExpense.SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner, ct);
        if (item == null) return NotFound();
        if (item.Version != request.Version) return Conflict(new { Code = "TransactionChanged" });
        // Giữ nguyên danh mục đã bị ẩn thì vẫn sửa được số tiền, ghi chú...
        if (await Category(request, owner, item.CategoryCode, ct) is not { } category) return BadRequest(new { Code = "InvalidTransaction" });
        Apply(item, request, category); item.Version++; item.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        try { await db.SaveChangesAsync(ct); } catch (DbUpdateConcurrencyException) { return Conflict(new { Code = "TransactionChanged" }); }
        return Ok(Response(item));
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, int version, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Guid.TryParse(id, out _) || version < 1) return BadRequest(new { Code = "InvalidTransaction" });
        var item = await db.PersonalExpense.SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner, ct);
        if (item == null) return NotFound();
        if (item.Version != version) return Conflict(new { Code = "TransactionChanged" });
        db.PersonalExpense.Remove(item);
        try { await db.SaveChangesAsync(ct); } catch (DbUpdateConcurrencyException) { return Conflict(new { Code = "TransactionChanged" }); }
        return NoContent();
    }
    // Giao dịch hợp lệ thì trả về danh mục dùng được: thuộc danh sách của chính người này
    // và đúng loại (khoản thu không chọn được danh mục chỉ dành cho chi, và ngược lại).
    private async Task<LookupListModel?> Category(PersonalExpenseRequest r, string owner, string? currentCode, CancellationToken ct)
    {
        if (r.Type is not ("income" or "expense") || r.Amount is < 1 or > 1_000_000_000_000 ||
            !DateOnly.TryParseExact(r.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _) ||
            (r.Note?.Length ?? 0) > 500) return null;
        var category = await lookups.FindUsableAsync(owner, LookupListCodes.ExpenseCategory, (r.CategoryCode ?? "").Trim(), currentCode, ct);
        return category != null && (category.Kind == "both" || category.Kind == r.Type) ? category : null;
    }
    private static void Apply(PersonalExpenseModel item, PersonalExpenseRequest r, LookupListModel category)
    {
        item.Type = r.Type; item.Amount = r.Amount; item.Date = DateOnly.ParseExact(r.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        item.CategoryCode = category.Code; item.Category = category.NameVi; item.Note = (r.Note ?? "").Trim();
    }
    private static object Response(PersonalExpenseModel item) => new { item.Id, item.Type, item.Amount, item.Date, item.Category, item.CategoryCode, item.Note, item.Version };
}
