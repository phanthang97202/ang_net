using System.Security.Claims;
using angnet.Domain.Models;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

public class LookupMoveRequest { public string Direction { get; set; } = ""; }

/*
    Danh sách chọn riêng của người đang đăng nhập (Loại hoạt động, Trạng thái của lịch,
    Danh mục thu chi). Mỗi danh sách gác bằng quyền của module dùng nó; mọi thao tác
    trong service đều lọc theo OwnerId nên không đụng được mục của người khác.
*/
[ApiController, Route("api/LookupList"), Authorize, EnableRateLimiting("API")]
public class LookupListController(LookupListService lookups, IAuthorizationService authorization) : ControllerBase
{
    private string? OwnerId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> List(string? listCode, bool includeInactive = false, CancellationToken ct = default)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!LookupListService.IsListCode(listCode)) return BadRequest(new { Code = "InvalidList" });
        if (!await CanUse(listCode!)) return Forbid();
        var items = await lookups.ListAsync(owner, listCode!, includeInactive, ct);
        // Màn quản lý cần biết mục nào đang được dùng (xóa sẽ thành ẩn)
        var inUse = includeInactive ? await lookups.CodesInUseAsync(owner, listCode!, ct) : [];
        return Ok(items.Select(x => Response(x, inUse.Contains(x.Code))));
    }

    [HttpPost, RequestSizeLimit(4096)]
    public async Task<IActionResult> Create(string? listCode, LookupItemRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        if (!LookupListService.IsListCode(listCode)) return BadRequest(new { Code = "InvalidList" });
        if (!await CanUse(listCode!)) return Forbid();
        var (result, item) = await lookups.CreateAsync(owner, listCode!, request, ct);
        return result switch
        {
            LookupResult.Ok => Ok(Response(item!, false)),
            LookupResult.Limit => BadRequest(new { Code = "TooManyItems" }),
            _ => BadRequest(new { Code = "InvalidItem" }),
        };
    }

    [HttpPut("{id}"), RequestSizeLimit(4096)]
    public async Task<IActionResult> Update(string id, LookupItemRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        var denied = await CheckItem(owner, id, ct);
        if (denied != null) return denied;
        var (result, item) = await lookups.UpdateAsync(owner, id, request, ct);
        return result switch
        {
            LookupResult.Ok => Ok(Response(item!, false)),
            LookupResult.NotFound => NotFound(),
            _ => BadRequest(new { Code = "InvalidItem" }),
        };
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        var denied = await CheckItem(owner, id, ct);
        if (denied != null) return denied;
        return await lookups.DeleteAsync(owner, id, ct) switch
        {
            LookupResult.Deleted => Ok(new { Result = "deleted" }),
            LookupResult.Hidden => Ok(new { Result = "hidden" }),
            _ => NotFound(),
        };
    }

    [HttpPost("{id}/move"), RequestSizeLimit(1024)]
    public async Task<IActionResult> Move(string id, LookupMoveRequest request, CancellationToken ct)
    {
        if (OwnerId is not { Length: > 0 } owner) return Unauthorized();
        var denied = await CheckItem(owner, id, ct);
        if (denied != null) return denied;
        return await lookups.MoveAsync(owner, id, request?.Direction, ct) switch
        {
            LookupResult.Ok => NoContent(),
            LookupResult.NotFound => NotFound(),
            _ => BadRequest(new { Code = "InvalidMove" }),
        };
    }

    // Mục của người khác trả NotFound như mục không tồn tại; mục của mình thì cần quyền module
    private async Task<IActionResult?> CheckItem(string owner, string id, CancellationToken ct)
    {
        var item = await lookups.FindAsync(owner, id, ct);
        if (item == null) return NotFound();
        return await CanUse(item.ListCode) ? null : Forbid();
    }

    private async Task<bool> CanUse(string listCode) =>
        LookupListCodes.Permission(listCode) is { } permission &&
        (await authorization.AuthorizeAsync(User, permission)).Succeeded;

    private static object Response(LookupListModel x, bool inUse) =>
        new { x.Id, x.ListCode, x.Code, x.NameVi, x.NameEn, x.Color, x.Kind, x.SortOrder, x.FlagActive, InUse = inUse };
}
