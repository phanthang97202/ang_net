using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Http;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services
{
    public class ReelService : IReelService
    {
        private const int MaxPageSize = 50;

        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;

        public ReelService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<ReelDto>> GetFeed(ClaimsPrincipal user, int pageSize, string cursor)
        {
            ApiResponse<ReelDto> apiResponse = new ApiResponse<ReelDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new { pageSize, cursor }, ref requestClient);

            // Endpoint public: có token thì biết user để tính IsLikedByMe, không có vẫn xem được feed.
            string currentUserId = GetCurrentUserId(user);

            (List<ReelDto> dataResult, string nextCursor, bool hasMore) = await _unitOfWork.ReelRespository
                                            .GetFeed(NormalizePageSize(pageSize, 10), cursor, currentUserId);

            apiResponse.objResult = new CursorPageInfo<ReelDto>
            {
                DataList = dataResult,
                NextCursor = nextCursor,
                HasMore = hasMore,
            };

            return apiResponse;
        }

        public async Task<ApiResponse<ReelDto>> Detail(ClaimsPrincipal user, string reelId)
        {
            ApiResponse<ReelDto> apiResponse = new ApiResponse<ReelDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(reelId, ref requestClient);

            if (TCommonUtils.IsNullOrEmpty(reelId))
            {
                apiResponse.CatchException(false, "Reel_Detail.ReelIdIsNotValid", requestClient);
                return apiResponse;
            }

            string currentUserId = GetCurrentUserId(user);

            ReelDto reel = await _unitOfWork.ReelRespository.GetDetail(reelId, currentUserId);
            if (reel == null)
            {
                apiResponse.CatchException(false, "Reel_Detail.ReelIsNotExists", requestClient);
                return apiResponse;
            }

            apiResponse.Data = reel;

            return apiResponse;
        }

        public async Task<ApiResponse<ReelDto>> Create(ClaimsPrincipal user, ReelCreateDto data)
        {
            ApiResponse<ReelDto> apiResponse = new ApiResponse<ReelDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            string currentUserId = GetCurrentUserId(user);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "Reel_Create.UserIsNotFound", requestClient);
                return apiResponse;
            }

            if (data == null || data.Media == null || data.Media.Count == 0)
            {
                apiResponse.CatchException(false, "Reel_Create.MediaIsNotValid", requestClient);
                return apiResponse;
            }

            if (data.Media.Any(m => TCommonUtils.IsNullOrEmpty(m.MediaUrl)))
            {
                apiResponse.CatchException(false, "Reel_Create.MediaUrlIsNotValid", requestClient);
                return apiResponse;
            }

            if (data.MediaType == Domain.Enums.EReelMediaType.Video && data.Media.Count != 1)
            {
                apiResponse.CatchException(false, "Reel_Create.VideoMustHaveExactlyOneMedia", requestClient);
                return apiResponse;
            }

            DateTime now = TCommonUtils.DTimeNow();

            ReelModel reel = new ReelModel
            {
                UserId = currentUserId,
                Caption = data.Caption ?? string.Empty,
                MediaType = data.MediaType,
                CoverUrl = data.CoverUrl ?? string.Empty,
                FlagActive = true,
                CreatedBy = currentUserId,
                UpdatedBy = currentUserId,
                CreatedDTime = now,
                UpdatedDTime = now,
            };

            List<ReelMediaModel> media = data.Media
                .Select((m, index) => new ReelMediaModel
                {
                    ReelId = reel.ReelId,
                    MediaUrl = m.MediaUrl,
                    SortOrder = index,
                    DurationSeconds = m.DurationSeconds,
                    Width = m.Width,
                    Height = m.Height,
                    FlagActive = true,
                    CreatedBy = currentUserId,
                    UpdatedBy = currentUserId,
                    CreatedDTime = now,
                    UpdatedDTime = now,
                })
                .ToList();

            await _unitOfWork.ReelRespository.CreateWithMedia(reel, media);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = await _unitOfWork.ReelRespository.GetDetail(reel.ReelId, currentUserId);

            return apiResponse;
        }

        public async Task<ApiResponse<ReelDto>> Delete(ClaimsPrincipal user, string reelId)
        {
            ApiResponse<ReelDto> apiResponse = new ApiResponse<ReelDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(reelId, ref requestClient);

            string currentUserId = GetCurrentUserId(user);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "Reel_Delete.UserIsNotFound", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.ReelRespository
                                            .CheckRecordExist<ReelModel>(x => x.ReelId == reelId && x.FlagActive);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "Reel_Delete.ReelIsNotExists", requestClient);
                return apiResponse;
            }

            if (_data.UserId != currentUserId && !user.IsInRole("Admin"))
            {
                apiResponse.CatchException(false, "Reel_Delete.403_Forbidden", requestClient);
                return apiResponse;
            }

            // Xóa mềm: giữ dữ liệu, chỉ tắt FlagActive (không dùng Repository.Delete vì đó là xóa cứng)
            _data.FlagActive = false;
            _data.UpdatedBy = currentUserId;
            _data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.ReelRespository.Update(_data
                                                    , x => x.FlagActive
                                                    , x => x.UpdatedBy
                                                    , x => x.UpdatedDTime
                                                    );
            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }

        public async Task<ApiResponse<ReelDto>> ToggleLike(ClaimsPrincipal user, string reelId)
        {
            ApiResponse<ReelDto> apiResponse = new ApiResponse<ReelDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(reelId, ref requestClient);

            string currentUserId = GetCurrentUserId(user);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "Reel_Like.UserIsNotFound", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.ReelRespository
                                            .CheckRecordExist<ReelModel>(x => x.ReelId == reelId && x.FlagActive);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "Reel_Like.ReelIsNotExists", requestClient);
                return apiResponse;
            }

            (bool liked, int likeCount) = await _unitOfWork.ReelRespository
                                            .ToggleLike(reelId, currentUserId, TCommonUtils.DTimeNow());

            apiResponse.objResult = new { ReelId = reelId, Liked = liked, LikeCount = likeCount };

            return apiResponse;
        }

        public async Task<ApiResponse<ReelDto>> IncrementView(ClaimsPrincipal user, string reelId)
        {
            ApiResponse<ReelDto> apiResponse = new ApiResponse<ReelDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(reelId, ref requestClient);

            if (TCommonUtils.IsNullOrEmpty(reelId))
            {
                apiResponse.CatchException(false, "Reel_View.ReelIdIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.ReelRespository
                                            .CheckRecordExist<ReelModel>(x => x.ReelId == reelId && x.FlagActive);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "Reel_View.ReelIsNotExists", requestClient);
                return apiResponse;
            }

            int viewCount = await _unitOfWork.ReelRespository.IncrementView(reelId);

            apiResponse.objResult = new { ReelId = reelId, ViewCount = viewCount };

            return apiResponse;
        }

        public async Task<ApiResponse<ReelCommentDto>> GetComments(ClaimsPrincipal user, string reelId, int pageSize, string cursor)
        {
            ApiResponse<ReelCommentDto> apiResponse = new ApiResponse<ReelCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new { reelId, pageSize, cursor }, ref requestClient);

            if (TCommonUtils.IsNullOrEmpty(reelId))
            {
                apiResponse.CatchException(false, "Reel_GetComments.ReelIdIsNotValid", requestClient);
                return apiResponse;
            }

            string currentUserId = GetCurrentUserId(user);

            (List<ReelCommentDto> dataResult, string nextCursor, bool hasMore) = await _unitOfWork.ReelCommentRespository
                                            .GetTopLevelComments(reelId, NormalizePageSize(pageSize, 20), cursor, currentUserId);

            apiResponse.objResult = new CursorPageInfo<ReelCommentDto>
            {
                DataList = dataResult,
                NextCursor = nextCursor,
                HasMore = hasMore,
            };

            return apiResponse;
        }

        public async Task<ApiResponse<ReelCommentDto>> GetReplies(ClaimsPrincipal user, string commentId, int pageSize, string cursor)
        {
            ApiResponse<ReelCommentDto> apiResponse = new ApiResponse<ReelCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new { commentId, pageSize, cursor }, ref requestClient);

            if (TCommonUtils.IsNullOrEmpty(commentId))
            {
                apiResponse.CatchException(false, "Reel_GetReplies.CommentIdIsNotValid", requestClient);
                return apiResponse;
            }

            string currentUserId = GetCurrentUserId(user);

            (List<ReelCommentDto> dataResult, string nextCursor, bool hasMore) = await _unitOfWork.ReelCommentRespository
                                            .GetReplies(commentId, NormalizePageSize(pageSize, 10), cursor, currentUserId);

            apiResponse.objResult = new CursorPageInfo<ReelCommentDto>
            {
                DataList = dataResult,
                NextCursor = nextCursor,
                HasMore = hasMore,
            };

            return apiResponse;
        }

        public async Task<ApiResponse<ReelCommentDto>> AddComment(ClaimsPrincipal user, ReelCommentCreateDto data)
        {
            ApiResponse<ReelCommentDto> apiResponse = new ApiResponse<ReelCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            string currentUserId = GetCurrentUserId(user);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "Reel_AddComment.UserIsNotFound", requestClient);
                return apiResponse;
            }

            if (data == null || TCommonUtils.IsNullOrEmpty(data.ReelId))
            {
                apiResponse.CatchException(false, "Reel_AddComment.ReelIdIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.Content))
            {
                apiResponse.CatchException(false, "Reel_AddComment.ContentIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistReel, _reel) = await _unitOfWork.ReelRespository
                                            .CheckRecordExist<ReelModel>(x => x.ReelId == data.ReelId && x.FlagActive);

            if (isExistReel == false)
            {
                apiResponse.CatchException(false, "Reel_AddComment.ReelIsNotExists", requestClient);
                return apiResponse;
            }

            if (!TCommonUtils.IsNullOrEmpty(data.ParentCommentId))
            {
                var (isExistParent, _parent) = await _unitOfWork.ReelCommentRespository
                                                .CheckRecordExist<ReelCommentModel>(x => x.CommentId == data.ParentCommentId && x.FlagActive);

                if (isExistParent == false)
                {
                    apiResponse.CatchException(false, "Reel_AddComment.ParentCommentIsNotExists", requestClient);
                    return apiResponse;
                }

                if (_parent.ReelId != data.ReelId)
                {
                    apiResponse.CatchException(false, "Reel_AddComment.ParentCommentNotBelongToReel", requestClient);
                    return apiResponse;
                }

                // Chỉ cho reply 1 cấp (giống TikTok/Instagram): không reply vào một reply
                if (_parent.ParentCommentId != null)
                {
                    apiResponse.CatchException(false, "Reel_AddComment.ReplyOnReplyIsNotAllowed", requestClient);
                    return apiResponse;
                }
            }

            DateTime now = TCommonUtils.DTimeNow();

            ReelCommentModel comment = new ReelCommentModel
            {
                ReelId = data.ReelId,
                UserId = currentUserId,
                ParentCommentId = TCommonUtils.IsNullOrEmpty(data.ParentCommentId) ? null : data.ParentCommentId,
                Content = data.Content,
                FlagActive = true,
                CreatedBy = currentUserId,
                UpdatedBy = currentUserId,
                CreatedDTime = now,
                UpdatedDTime = now,
            };

            await _unitOfWork.ReelCommentRespository.AddComment(comment);

            apiResponse.Data = new ReelCommentDto
            {
                CommentId = comment.CommentId,
                ReelId = comment.ReelId,
                UserId = comment.UserId,
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content,
                ReplyCount = comment.ReplyCount,
                IsOwnedByMe = true,
                CreatedDTime = comment.CreatedDTime,
            };

            return apiResponse;
        }

        // Endpoint public vẫn chạy qua JWT middleware, nên khi có token hợp lệ vẫn lấy được user
        private static string GetCurrentUserId(ClaimsPrincipal user)
        {
            return user?.Identity?.IsAuthenticated == true
                ? user.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;
        }

        private static int NormalizePageSize(int pageSize, int defaultSize)
        {
            if (pageSize <= 0)
            {
                return defaultSize;
            }

            return pageSize > MaxPageSize ? MaxPageSize : pageSize;
        }
    }
}
