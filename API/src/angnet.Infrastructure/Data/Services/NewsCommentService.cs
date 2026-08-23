using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using angnet.Infrastructure.Data.UnitOfWork;
using Microsoft.AspNetCore.Http;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services
{
    public class NewsCommentService : INewsCommentService
    {
        private const string ReportThresholdCode = "NEWS_COMMENT_REPORT_THRESHOLD";
        private const int DefaultReportThreshold = 3;

        private readonly AppDbContext _dbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUnitOfWork _unitOfWork;

        public NewsCommentService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<NewsCommentDto>> GetComments(
            ClaimsPrincipal user, string newsId, int pageIndex, int pageSize, string sort, DateTime? snapshot)
        {
            ApiResponse<NewsCommentDto> apiResponse = new ApiResponse<NewsCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new { newsId, pageIndex, pageSize, sort }, ref requestClient);

            if (TCommonUtils.IsNullOrEmpty(newsId))
            {
                apiResponse.CatchException(false, "NewsComment_Get.NewsIdIsNotValid", requestClient);
                return apiResponse;
            }

            string currentUserId = GetCurrentUserId(user);
            int _pageIndex = pageIndex > 0 ? pageIndex : 0;
            int _pageSize = NormalizePageSize(pageSize, 5);
            ENewsCommentSort _sort = string.Equals(sort, "Newest", StringComparison.OrdinalIgnoreCase)
                                        ? ENewsCommentSort.Newest
                                        : ENewsCommentSort.Popular;

            (List<NewsCommentDto> dataResult, int itemCount) = await _unitOfWork.NewsCommentRepository
                    .GetTopLevelComments(newsId, _pageIndex, _pageSize, _sort, currentUserId, snapshot);

            PageInfo<NewsCommentDto> pageInfo = new PageInfo<NewsCommentDto>
            {
                PageIndex = _pageIndex,
                PageSize = _pageSize,
                PageCount = itemCount % _pageSize == 0 ? itemCount / _pageSize : itemCount / _pageSize + 1,
                ItemCount = itemCount,
                DataList = dataResult,
            };

            apiResponse.objResult = pageInfo;
            // Tổng mọi cấp, dùng cho tiêu đề "Bình luận (N)" - khác ItemCount vốn chỉ đếm bình luận gốc
            apiResponse.Data = new NewsCommentDto
            {
                NewsId = newsId,
                ReplyCount = await _unitOfWork.NewsCommentRepository.CountVisible(newsId),
            };

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCommentDto>> GetReplies(
            ClaimsPrincipal user, string commentId, int pageIndex, int pageSize)
        {
            ApiResponse<NewsCommentDto> apiResponse = new ApiResponse<NewsCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new { commentId, pageIndex, pageSize }, ref requestClient);

            if (TCommonUtils.IsNullOrEmpty(commentId))
            {
                apiResponse.CatchException(false, "NewsComment_Replies.CommentIdIsNotValid", requestClient);
                return apiResponse;
            }

            string currentUserId = GetCurrentUserId(user);
            int _pageIndex = pageIndex > 0 ? pageIndex : 0;
            int _pageSize = NormalizePageSize(pageSize, 5);

            (List<NewsCommentDto> dataResult, int itemCount) = await _unitOfWork.NewsCommentRepository
                    .GetReplies(commentId, _pageIndex, _pageSize, currentUserId);

            apiResponse.objResult = new PageInfo<NewsCommentDto>
            {
                PageIndex = _pageIndex,
                PageSize = _pageSize,
                PageCount = itemCount % _pageSize == 0 ? itemCount / _pageSize : itemCount / _pageSize + 1,
                ItemCount = itemCount,
                DataList = dataResult,
            };

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCommentDto>> AddComment(ClaimsPrincipal user, NewsCommentCreateDto data)
        {
            ApiResponse<NewsCommentDto> apiResponse = new ApiResponse<NewsCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            string currentUserId = GetCurrentUserId(user);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "NewsComment_Create.UserIsNotFound", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.NewsId) || TCommonUtils.IsNullOrEmpty(data.Content))
            {
                apiResponse.CatchException(false, "NewsComment_Create.ContentIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistNews, _) = await _unitOfWork.NewsCommentRepository
                                        .CheckRecordExist<NewsModel>(x => x.NewsId == data.NewsId && x.FlagActive);
            if (isExistNews == false)
            {
                apiResponse.CatchException(false, "NewsComment_Create.NewsIsNotExists", requestClient);
                return apiResponse;
            }

            string parentCommentId = null;
            if (!TCommonUtils.IsNullOrEmpty(data.ParentCommentId))
            {
                var (isExistParent, parent) = await _unitOfWork.NewsCommentRepository
                        .CheckRecordExist<NewsCommentModel>(x => x.CommentId == data.ParentCommentId && x.FlagActive);

                if (isExistParent == false)
                {
                    apiResponse.CatchException(false, "NewsComment_Create.ParentCommentIsNotExists", requestClient);
                    return apiResponse;
                }

                if (parent.NewsId != data.NewsId)
                {
                    apiResponse.CatchException(false, "NewsComment_Create.ParentCommentNotBelongToNews", requestClient);
                    return apiResponse;
                }

                // Cây chỉ 2 cấp: trả lời một reply thì quy về chính bình luận gốc của nó
                parentCommentId = TCommonUtils.IsNullOrEmpty(parent.ParentCommentId)
                                    ? parent.CommentId
                                    : parent.ParentCommentId;
            }

            DateTime now = TCommonUtils.DTimeNow();
            NewsCommentModel comment = new NewsCommentModel
            {
                NewsId = data.NewsId,
                UserId = currentUserId,
                ParentCommentId = parentCommentId,
                Content = data.Content.Trim(),
                // Model mặc định Pending; không có luồng kiểm duyệt nên để Pending thì
                // mọi bình luận sẽ vô hình.
                Status = ENewsCommentStatus.Approved,
                FlagActive = true,
                CreatedBy = currentUserId,
                UpdatedBy = currentUserId,
                CreatedDTime = now,
                UpdatedDTime = now,
            };

            await _unitOfWork.NewsCommentRepository.AddComment(comment);

            apiResponse.Data = new NewsCommentDto
            {
                CommentId = comment.CommentId,
                NewsId = comment.NewsId,
                UserId = comment.UserId,
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content,
                IsOwnedByMe = true,
                CreatedDTime = comment.CreatedDTime,
            };

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCommentDto>> ToggleLike(ClaimsPrincipal user, string commentId)
        {
            ApiResponse<NewsCommentDto> apiResponse = new ApiResponse<NewsCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(commentId, ref requestClient);

            string currentUserId = GetCurrentUserId(user);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "NewsComment_Like.UserIsNotFound", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.NewsCommentRepository
                    .CheckRecordExist<NewsCommentModel>(x => x.CommentId == commentId && x.FlagActive);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "NewsComment_Like.CommentIsNotExists", requestClient);
                return apiResponse;
            }

            (bool liked, int likeCount) = await _unitOfWork.NewsCommentRepository
                    .ToggleLike(commentId, currentUserId, TCommonUtils.DTimeNow());

            apiResponse.objResult = new { CommentId = commentId, Liked = liked, LikeCount = likeCount };

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCommentDto>> ReportComment(
            ClaimsPrincipal user, NewsCommentReportCreateDto data)
        {
            ApiResponse<NewsCommentDto> apiResponse = new ApiResponse<NewsCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            string currentUserId = GetCurrentUserId(user);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "NewsComment_Report.UserIsNotFound", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.NewsCommentRepository
                    .CheckRecordExist<NewsCommentModel>(x => x.CommentId == data.CommentId && x.FlagActive);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "NewsComment_Report.CommentIsNotExists", requestClient);
                return apiResponse;
            }

            // Không cho tự báo cáo bình luận của chính mình - nếu không, tác giả có thể
            // tự góp phiếu để ẩn luồng của mình.
            if (_data.UserId == currentUserId)
            {
                apiResponse.CatchException(false, "NewsComment_Report.CannotReportOwnComment", requestClient);
                return apiResponse;
            }

            int threshold = await GetReportThreshold();

            NewsReportCommentModel report = new NewsReportCommentModel
            {
                CommentId = data.CommentId,
                UserId = currentUserId,
                Reason = data.Reason,
                Description = data.Description ?? string.Empty,
                Status = ENewsCommentReportStatus.Pending,
            };

            (bool created, int reportCount, bool autoHidden) = await _unitOfWork.NewsCommentRepository
                    .AddReport(report, threshold, TCommonUtils.DTimeNow());

            apiResponse.objResult = new
            {
                CommentId = data.CommentId,
                Created = created,
                ReportCount = reportCount,
                AutoHidden = autoHidden,
            };

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCommentDto>> DeleteComment(ClaimsPrincipal user, string commentId)
        {
            ApiResponse<NewsCommentDto> apiResponse = new ApiResponse<NewsCommentDto>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(commentId, ref requestClient);

            string currentUserId = GetCurrentUserId(user);
            if (TCommonUtils.IsNullOrEmpty(currentUserId))
            {
                apiResponse.CatchException(false, "NewsComment_Delete.UserIsNotFound", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.NewsCommentRepository
                    .CheckRecordExist<NewsCommentModel>(x => x.CommentId == commentId && x.FlagActive);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "NewsComment_Delete.CommentIsNotExists", requestClient);
                return apiResponse;
            }

            if (_data.UserId != currentUserId && !user.IsInRole("Admin"))
            {
                apiResponse.CatchException(false, "NewsComment_Delete.NotPermission", requestClient);
                return apiResponse;
            }

            NewsCommentModel entity = _data;
            entity.FlagActive = false;
            entity.UpdatedBy = currentUserId;
            entity.UpdatedDTime = TCommonUtils.DTimeNow();

            // Xoá mềm: BaseRepository.Delete gọi thẳng _dbCtx.Remove nên không dùng ở đây
            await _unitOfWork.NewsCommentRepository.Update(entity
                                    , x => x.FlagActive
                                    , x => x.UpdatedBy
                                    , x => x.UpdatedDTime);
            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }

        /// <summary>
        /// Đọc ngưỡng báo cáo trực tiếp từ repository chứ không qua SysParameterService:
        /// service đó có GuardAuth.IsAuthorized nên sẽ chặn người dùng thường.
        /// </summary>
        private async Task<int> GetReportThreshold()
        {
            var (isExist, param) = await _unitOfWork.SysParameterRespository
                    .CheckRecordExist<SysParameterModel>(x => x.ParameterCode == ReportThresholdCode && x.FlagActive);

            if (isExist && int.TryParse(param.ParameterValueVi, out int threshold) && threshold > 0)
            {
                return threshold;
            }

            return DefaultReportThreshold;
        }

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
            return pageSize > 50 ? 50 : pageSize;
        }
    }
}
