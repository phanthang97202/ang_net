using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Security.Claims;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
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
    [Required, MaxLength(80)] public string Category { get; set; } = "";
    [MaxLength(500)] public string Note { get; set; } = "";
    public int Version { get; set; }
}
public class PersonalExpenseCategoryRequest { [Required, MaxLength(80)] public string Name { get; set; } = ""; }

[ApiController, Route("api/PersonalExpenses"), Authorize(Policy = "expenses.use"), EnableRateLimiting("API")]
public class PersonalExpensesController(AppDbContext db, TimeProvider clock) : ControllerBase
{
    private static readonly string[] Defaults = ["Lương", "Thu nhập khác", "Ăn uống", "Đi lại", "Mua sắm", "Hóa đơn", "Nhà ở", "Giải trí", "Sức khỏe", "Khác"];
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
    [HttpGet("categories"), ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Categories(CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        var custom = await db.PersonalExpenseCategory.AsNoTracking().Where(x => x.OwnerId == owner).OrderBy(x => x.Name).Select(x => x.Name).ToListAsync(ct);
        return Ok(Defaults.Concat(custom));
    }
    [HttpPost("categories"), RequestSizeLimit(4096)]
    public async Task<IActionResult> CreateCategory(PersonalExpenseCategoryRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        var name = (request.Name ?? "").Trim();
        if (name.Length is < 1 or > 80) return BadRequest(new { Code = "InvalidCategory" });
        var normalized = name.ToUpperInvariant();
        if (Defaults.Any(x => x.ToUpperInvariant() == normalized) || await db.PersonalExpenseCategory.AnyAsync(x => x.OwnerId == owner && x.NormalizedName == normalized, ct)) return Conflict(new { Code = "CategoryExists" });
        db.PersonalExpenseCategory.Add(new PersonalExpenseCategoryModel { Id = Guid.NewGuid().ToString(), OwnerId = owner, Name = name, NormalizedName = normalized });
        try { await db.SaveChangesAsync(ct); } catch (DbUpdateException) { return Conflict(new { Code = "CategoryExists" }); }
        return Ok(new { Name = name });
    }
    [HttpPost, RequestSizeLimit(4096)]
    public async Task<IActionResult> Create(PersonalExpenseRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!await Valid(request, owner, ct)) return BadRequest(new { Code = "InvalidTransaction" });
        var now = clock.GetUtcNow().UtcDateTime;
        var item = new PersonalExpenseModel { Id = Guid.NewGuid().ToString(), OwnerId = owner, CreatedAt = now, UpdatedAt = now };
        Apply(item, request); db.PersonalExpense.Add(item); await db.SaveChangesAsync(ct);
        return Ok(Response(item));
    }
    [HttpPut("{id}"), RequestSizeLimit(4096)]
    public async Task<IActionResult> Update(string id, PersonalExpenseRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!Guid.TryParse(id, out _) || request.Version < 1 || request.Version == int.MaxValue || !await Valid(request, owner, ct)) return BadRequest(new { Code = "InvalidTransaction" });
        var item = await db.PersonalExpense.SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == owner, ct);
        if (item == null) return NotFound();
        if (item.Version != request.Version) return Conflict(new { Code = "TransactionChanged" });
        Apply(item, request); item.Version++; item.UpdatedAt = clock.GetUtcNow().UtcDateTime;
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
    private async Task<bool> Valid(PersonalExpenseRequest r, string owner, CancellationToken ct)
    {
        var category = (r.Category ?? "").Trim();
        if (r.Type is not ("income" or "expense") || r.Amount is < 1 or > 1_000_000_000_000 ||
            !DateOnly.TryParseExact(r.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _) ||
            category.Length is < 1 or > 80 || (r.Note?.Length ?? 0) > 500) return false;
        return Defaults.Contains(category) || await db.PersonalExpenseCategory.AnyAsync(x => x.OwnerId == owner && x.Name == category, ct);
    }
    private static void Apply(PersonalExpenseModel item, PersonalExpenseRequest r)
    {
        item.Type = r.Type; item.Amount = r.Amount; item.Date = DateOnly.ParseExact(r.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        item.Category = r.Category.Trim(); item.Note = (r.Note ?? "").Trim();
    }
    private static object Response(PersonalExpenseModel item) => new { item.Id, item.Type, item.Amount, item.Date, item.Category, item.Note, item.Version };
}
