using System.Net;
using System.Text.RegularExpressions;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data.Repositories;
using Ganss.Xss;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services
{
    public class NoteService : INoteService
    {
        private const int AliasMaxLength = 100;
        private const int ContentMaxLength = 20_000;
        private const int RawContentMaxLength = 50_000;
        private const int MaxPageSize = 30;
        private const string FeatureDisabled = "Tính năng ghi chú hiện đang tạm tắt.";
        private const string NoteNotFound = "Ghi chú không tồn tại.";
        private static readonly string[] GeneratedAliases =
        {
            "Người qua đường",
            "Kẻ mộng mơ",
            "Người kể chuyện",
            "Vị khách nhỏ",
            "Người thích viết",
            "Một người bạn",
            "Kẻ hay nghĩ",
            "Người lạ thân quen",
        };

        private readonly AppDbContext _dbContext;
        private readonly HtmlSanitizer _sanitizer;

        public NoteService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
            _sanitizer = CreateSanitizer();
        }

        public async Task<ApiResponse<NoteDto>> GetPublicFeed(int pageSize, string cursor)
        {
            if (!await IsFeatureEnabled())
            {
                return new ApiResponse<NoteDto>(FeatureDisabled);
            }

            pageSize = NormalizePageSize(pageSize, 10);
            IQueryable<NoteModel> query = _dbContext.Note.AsNoTracking()
                .Where(note => note.FlagActive);

            var decodedCursor = ReelCursor.Decode(cursor);
            if (decodedCursor != null)
            {
                DateTime cursorDTime = decodedCursor.Value.CreatedDTime;
                string cursorId = decodedCursor.Value.Id;
                query = query.Where(note => note.CreatedDTime < cursorDTime
                    || (note.CreatedDTime == cursorDTime
                        && string.Compare(note.NoteId, cursorId) < 0));
            }

            List<NoteDto> notes = await query
                .OrderByDescending(note => note.CreatedDTime)
                .ThenByDescending(note => note.NoteId)
                .Take(pageSize + 1)
                .Select(ToDto())
                .ToListAsync();

            bool hasMore = notes.Count > pageSize;
            if (hasMore)
            {
                notes.RemoveAt(notes.Count - 1);
            }

            string? nextCursor = hasMore && notes.Count > 0
                ? ReelCursor.Encode(notes[^1].CreatedDTime, notes[^1].NoteId)
                : null;

            return new ApiResponse<NoteDto>
            {
                objResult = new CursorPageInfo<NoteDto>
                {
                    DataList = notes,
                    NextCursor = nextCursor!,
                    HasMore = hasMore,
                }
            };
        }

        public async Task<ApiResponse<NoteDto>> Create(NoteCreateDto data)
        {
            if (!await IsFeatureEnabled())
            {
                return new ApiResponse<NoteDto>(FeatureDisabled);
            }

            if (data is null)
            {
                return new ApiResponse<NoteDto>("Dữ liệu ghi chú không hợp lệ.");
            }

            string alias = NormalizeAlias(data.Alias);
            if (string.IsNullOrWhiteSpace(alias))
            {
                alias = GenerateAlias();
            }
            if (alias.Length > AliasMaxLength)
            {
                return new ApiResponse<NoteDto>($"Bí danh không được vượt quá {AliasMaxLength} ký tự.");
            }

            string rawContent = data.ContentBody ?? string.Empty;
            if (rawContent.Length > RawContentMaxLength)
            {
                return new ApiResponse<NoteDto>("Nội dung ghi chú quá dài.");
            }

            string content = _sanitizer.Sanitize(rawContent).Trim();
            string plainText = PlainTextOf(content);
            if (string.IsNullOrWhiteSpace(plainText))
            {
                return new ApiResponse<NoteDto>("Vui lòng nhập nội dung ghi chú.");
            }
            if (plainText.Length > ContentMaxLength)
            {
                return new ApiResponse<NoteDto>($"Nội dung không được vượt quá {ContentMaxLength:N0} ký tự.");
            }

            DateTime now = TCommonUtils.DTimeNow();
            NoteModel note = new NoteModel
            {
                Alias = alias,
                ContentBody = content,
                FlagActive = true,
                CreatedBy = "anonymous",
                UpdatedBy = "anonymous",
                CreatedDTime = now,
                UpdatedDTime = now,
            };

            await _dbContext.Note.AddAsync(note);
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<NoteDto>(Map(note));
        }

        public async Task<ApiResponse<NoteDto>> SearchAdmin(
            int pageIndex, int pageSize, string keyword, bool? onlyActive)
        {
            pageIndex = Math.Max(pageIndex, 0);
            pageSize = NormalizePageSize(pageSize, 20);
            keyword = (keyword ?? string.Empty).Trim();

            IQueryable<NoteModel> query = _dbContext.Note.AsNoTracking();
            if (!string.IsNullOrEmpty(keyword))
            {
                string pattern = $"%{keyword}%";
                query = query.Where(note => EF.Functions.ILike(note.Alias, pattern)
                    || EF.Functions.ILike(note.ContentBody, pattern));
            }
            if (onlyActive.HasValue)
            {
                query = query.Where(note => note.FlagActive == onlyActive.Value);
            }

            int itemCount = await query.CountAsync();
            List<NoteDto> notes = await query
                .OrderByDescending(note => note.CreatedDTime)
                .ThenByDescending(note => note.NoteId)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .Select(ToDto())
                .ToListAsync();

            return new ApiResponse<NoteDto>
            {
                objResult = new PageInfo<NoteDto>
                {
                    PageIndex = pageIndex,
                    PageSize = pageSize,
                    ItemCount = itemCount,
                    PageCount = (int)Math.Ceiling(itemCount / (double)pageSize),
                    DataList = notes,
                }
            };
        }

        public async Task<ApiResponse<NoteDto>> ToggleActive(
            string noteId, bool flagActive, string actorId)
        {
            NoteModel? note = await _dbContext.Note.FirstOrDefaultAsync(x => x.NoteId == noteId);
            if (note is null)
            {
                return new ApiResponse<NoteDto>(NoteNotFound);
            }

            note.FlagActive = flagActive;
            note.UpdatedBy = actorId;
            note.UpdatedDTime = TCommonUtils.DTimeNow();
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<NoteDto>(Map(note));
        }

        public async Task<ApiResponse<bool>> Delete(string noteId)
        {
            NoteModel? note = await _dbContext.Note.FirstOrDefaultAsync(x => x.NoteId == noteId);
            if (note is null)
            {
                return new ApiResponse<bool>(NoteNotFound);
            }

            _dbContext.Note.Remove(note);
            await _dbContext.SaveChangesAsync();
            return new ApiResponse<bool>(true);
        }

        private async Task<bool> IsFeatureEnabled()
        {
            // Một menu con chỉ thực sự hiển thị khi cả nó và menu cha đều bật.
            // API public dùng cùng quy tắc để việc tắt menu cũng khóa dữ liệu.
            return await _dbContext.SysMenu.AsNoTracking().AnyAsync(menu =>
                menu.Path == "/note"
                && menu.FlagActive
                && (menu.ParentId == null || _dbContext.SysMenu.Any(parent =>
                    parent.MenuId == menu.ParentId && parent.FlagActive)));
        }

        private static System.Linq.Expressions.Expression<Func<NoteModel, NoteDto>> ToDto()
        {
            return note => new NoteDto
            {
                NoteId = note.NoteId,
                Alias = note.Alias,
                ContentBody = note.ContentBody,
                FlagActive = note.FlagActive,
                CreatedDTime = note.CreatedDTime,
                UpdatedDTime = note.UpdatedDTime,
            };
        }

        private static NoteDto Map(NoteModel note)
        {
            return new NoteDto
            {
                NoteId = note.NoteId,
                Alias = note.Alias,
                ContentBody = note.ContentBody,
                FlagActive = note.FlagActive,
                CreatedDTime = note.CreatedDTime,
                UpdatedDTime = note.UpdatedDTime,
            };
        }

        private static HtmlSanitizer CreateSanitizer()
        {
            HtmlSanitizer sanitizer = new HtmlSanitizer();
            sanitizer.AllowedTags.Clear();
            foreach (string tag in new[]
            {
                "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
                "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "code", "pre", "a"
            })
            {
                sanitizer.AllowedTags.Add(tag);
            }

            sanitizer.AllowedAttributes.Clear();
            sanitizer.AllowedAttributes.Add("href");
            sanitizer.AllowedAttributes.Add("title");

            sanitizer.AllowedSchemes.Clear();
            sanitizer.AllowedSchemes.Add("http");
            sanitizer.AllowedSchemes.Add("https");
            sanitizer.AllowedSchemes.Add("mailto");
            return sanitizer;
        }

        private static string NormalizeAlias(string? alias)
        {
            return Regex.Replace((alias ?? string.Empty).Trim(), @"\s+", " ");
        }

        private static string GenerateAlias()
        {
            return GeneratedAliases[Random.Shared.Next(GeneratedAliases.Length)];
        }

        private static string PlainTextOf(string html)
        {
            string withoutTags = Regex.Replace(html, "<[^>]*>", " ");
            return Regex.Replace(WebUtility.HtmlDecode(withoutTags), @"\s+", " ").Trim();
        }

        private static int NormalizePageSize(int pageSize, int defaultSize)
        {
            if (pageSize <= 0) return defaultSize;
            return Math.Min(pageSize, MaxPageSize);
        }
    }
}
