using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Mail.Producer;
using angnet.Infrastructure.Mail.Service;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services
{
    public interface ISubscriberService
    {
        Task<ApiResponse<SubscribeResultDto>> SubscribeAsync(string email);
        Task<bool> UnsubscribeAsync(string token);
        Task<ApiResponse<SubscriberItemDto>> SearchAsync(int pageIndex, int pageSize, string keyword, bool? onlyActive);
        Task<ApiResponse<NotifyResultDto>> NotifyNewPostAsync(string newsId);
    }

    public class SubscriberService : ISubscriberService
    {
        private readonly AppDbContext _dbContext;
        private readonly RabbitMqEmailProducer _emailProducer;

        // Địa chỉ gửi đi, dùng chung với mail đăng ký tài khoản.
        private const string MAIL_FROM = "phanthang97202@gmail.com";

        public SubscriberService(AppDbContext dbContext, RabbitMqEmailProducer emailProducer)
        {
            _dbContext = dbContext;
            _emailProducer = emailProducer;
        }

        public async Task<ApiResponse<SubscribeResultDto>> SubscribeAsync(string email)
        {
            ApiResponse<SubscribeResultDto> apiResponse = new ApiResponse<SubscribeResultDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            string normalized = (email ?? string.Empty).Trim().ToLowerInvariant();

            if (TCommonUtils.IsNullOrEmpty(normalized) || !normalized.Contains('@'))
            {
                apiResponse.CatchException(false, "Subscribe.EmailIsNotValid", requestClient);
                return apiResponse;
            }

            SubscriberModel existing = await _dbContext.Subscriber
                .FirstOrDefaultAsync(x => x.Email == normalized);

            // Đã đăng ký và vẫn đang nhận: không ghi gì thêm, cũng không gửi lại mail
            // chào - bấm nút nhiều lần không được phép biến thành công cụ spam người
            // khác. Vẫn trả Success = true để client hiện đúng một màn hình.
            if (existing is not null && existing.FlagActive)
            {
                apiResponse.Data = new SubscribeResultDto
                {
                    Email = normalized,
                    AlreadySubscribed = true
                };
                return apiResponse;
            }

            bool isResubscribe = existing is not null;

            if (isResubscribe)
            {
                // Từng huỷ rồi đăng ký lại: bật lại bản ghi cũ và cấp token mới, token
                // cũ đã nằm trong hộp thư của họ nên phải vô hiệu đi.
                existing.FlagActive = true;
                existing.UnsubscribedDTime = null;
                existing.UnsubscribeToken = Guid.NewGuid().ToString("N");
                existing.UpdatedDTime = TCommonUtils.DTimeNow();
            }
            else
            {
                await _dbContext.Subscriber.AddAsync(new SubscriberModel
                {
                    Email = normalized,
                    FlagActive = true,
                    CreatedDTime = TCommonUtils.DTimeNow(),
                    UpdatedDTime = TCommonUtils.DTimeNow()
                });
            }

            await _dbContext.SaveChangesAsync();

            // Lấy lại token sau khi lưu để đưa vào link huỷ trong mail.
            string token = isResubscribe
                ? existing.UnsubscribeToken
                : (await _dbContext.Subscriber.AsNoTracking()
                        .FirstAsync(x => x.Email == normalized)).UnsubscribeToken;

            await SendWelcomeMailAsync(normalized, token);

            apiResponse.Data = new SubscribeResultDto
            {
                Email = normalized,
                AlreadySubscribed = false
            };
            return apiResponse;
        }

        // Danh sách cho trang quản trị. Trả cả người đã huỷ (onlyActive = null) vì
        // biết ai vừa bỏ theo dõi cũng là thông tin có ích, chỉ là hiện khác trạng
        // thái trên bảng.
        public async Task<ApiResponse<SubscriberItemDto>> SearchAsync(
            int pageIndex, int pageSize, string keyword, bool? onlyActive)
        {
            ApiResponse<SubscriberItemDto> apiResponse = new ApiResponse<SubscriberItemDto>();

            int _pageIndex = pageIndex < 0 ? 0 : pageIndex;
            // Chặn trần pageSize: client truyền được số bất kỳ, pageSize=100000 là
            // một câu truy vấn kéo sập cả trang quản trị.
            int _pageSize = pageSize is <= 0 or > 200 ? 20 : pageSize;

            IQueryable<SubscriberModel> query = _dbContext.Subscriber.AsNoTracking();

            string _keyword = (keyword ?? string.Empty).Trim().ToLowerInvariant();
            if (!TCommonUtils.IsNullOrEmpty(_keyword))
            {
                query = query.Where(x => x.Email.Contains(_keyword));
            }

            if (onlyActive.HasValue)
            {
                query = query.Where(x => x.FlagActive == onlyActive.Value);
            }

            int itemCount = await query.CountAsync();

            List<SubscriberItemDto> dataList = await query
                .OrderByDescending(x => x.CreatedDTime)
                .Skip(_pageIndex * _pageSize)
                .Take(_pageSize)
                .Select(x => new SubscriberItemDto
                {
                    SubscriberId = x.SubscriberId,
                    Email = x.Email,
                    FlagActive = x.FlagActive,
                    CreatedDTime = x.CreatedDTime,
                    UnsubscribedDTime = x.UnsubscribedDTime
                })
                .ToListAsync();

            apiResponse.objResult = new PageInfo<SubscriberItemDto>
            {
                PageIndex = _pageIndex,
                PageSize = _pageSize,
                PageCount = itemCount % _pageSize == 0
                    ? itemCount / _pageSize
                    : itemCount / _pageSize + 1,
                ItemCount = itemCount,
                DataList = dataList
            };

            return apiResponse;
        }

        // Gửi mail báo bài mới cho toàn bộ người đang nhận.
        public async Task<ApiResponse<NotifyResultDto>> NotifyNewPostAsync(string newsId)
        {
            ApiResponse<NotifyResultDto> apiResponse = new ApiResponse<NotifyResultDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            NewsModel news = await _dbContext.News
                .FirstOrDefaultAsync(x => x.NewsId == newsId);

            if (news is null)
            {
                apiResponse.CatchException(false, "Notify.NewsIsNotExist", requestClient);
                return apiResponse;
            }

            // Bài nháp thì chặn: link trong mail sẽ dẫn tới trang 404 vì Detail từ
            // chối trả bài chưa xuất bản cho khách vãng lai.
            if (!news.FlagActive)
            {
                apiResponse.CatchException(false, "Notify.NewsIsNotPublished", requestClient);
                return apiResponse;
            }

            // Đã gửi rồi thì thôi. Kiểm ở đây chứ không chỉ dựa vào nút bị khoá bên
            // client: bấm hai lần thật nhanh là hai request cùng đi.
            if (news.NotifiedAt.HasValue)
            {
                apiResponse.CatchException(false, "Notify.AlreadyNotified", requestClient);
                return apiResponse;
            }

            List<SubscriberModel> subscribers = await _dbContext.Subscriber
                .AsNoTracking()
                .Where(x => x.FlagActive)
                .ToListAsync();

            // Đánh dấu TRƯỚC khi đẩy mail: nếu đẩy xong mới ghi mà request chết giữa
            // chừng thì bài vẫn mang trạng thái "chưa gửi", bấm lại là người đọc nhận
            // hai lần. Thà mất một lần gửi còn hơn spam - và trường hợp không có ai
            // đăng ký cũng phải đánh dấu để nút không treo mãi.
            DateTime notifiedAt = TCommonUtils.DTimeNow();
            news.NotifiedAt = notifiedAt;
            await _dbContext.SaveChangesAsync();

            foreach (SubscriberModel subscriber in subscribers)
            {
                await SendNewPostMailAsync(news, subscriber);
            }

            apiResponse.Data = new NotifyResultDto
            {
                NewsId = news.NewsId,
                SentCount = subscribers.Count,
                NotifiedAt = notifiedAt
            };
            return apiResponse;
        }

        // Mỗi người một mail riêng chứ không gộp BCC: link huỷ đăng ký phải mang
        // token của chính người đó thì họ mới huỷ được, và BCC hàng loạt cũng dễ bị
        // Gmail đánh dấu spam.
        //
        // Bọc try/catch từng người: một địa chỉ hỏng không được làm dừng cả vòng gửi.
        private async Task SendNewPostMailAsync(NewsModel news, SubscriberModel subscriber)
        {
            try
            {
                string postUrl = $"https://phanthang.site/news/{news.CategoryNewsId}/{news.NewsId}";
                string unsubscribeUrl = $"https://phanthang.site/unsubscribe?token={subscriber.UnsubscribeToken}";

                string thumbnailHtml = TCommonUtils.IsNullOrEmpty(news.Thumbnail)
                    ? string.Empty
                    : $@"<a href='{postUrl}'>
                            <img src='{news.Thumbnail}' alt='' width='100%'
                                 style='max-width:560px;border-radius:12px;display:block' />
                         </a>";

                string body = $@"
                    <div style='font-family:Arial,sans-serif;font-size:15px;color:#1a1a2e;line-height:1.6;max-width:560px'>
                        <p style='color:#888;font-size:13px;margin:0 0 16px'>Bài viết mới trên blog</p>
                        {thumbnailHtml}
                        <h2 style='margin:16px 0 8px'>
                            <a href='{postUrl}' style='color:#1a1a2e;text-decoration:none'>{news.ShortTitle}</a>
                        </h2>
                        <p style='color:#555'>{news.ShortDescription}</p>
                        <p style='margin:24px 0'>
                            <a href='{postUrl}'
                               style='background:#5b4fe9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block'>
                                Đọc bài viết
                            </a>
                        </p>
                        <hr style='border:none;border-top:1px solid #e5e5e5;margin:24px 0' />
                        <p style='font-size:12px;color:#888'>
                            Bạn nhận thư này vì đã đăng ký theo dõi blog.
                            <a href='{unsubscribeUrl}' style='color:#888'>Huỷ đăng ký</a>
                        </p>
                    </div>";

                await _emailProducer.Publish(new EmailMessageModel
                {
                    From = MAIL_FROM,
                    To = subscriber.Email,
                    Subject = news.ShortTitle,
                    Body = body,
                    FromHtml = MAIL_FROM,
                    ToHtml = subscriber.Email
                });
            }
            catch
            {
                // Nuốt lỗi có chủ đích - xem giải thích ở trên.
            }
        }

        public async Task<bool> UnsubscribeAsync(string token)
        {
            if (TCommonUtils.IsNullOrEmpty(token))
            {
                return false;
            }

            SubscriberModel record = await _dbContext.Subscriber
                .FirstOrDefaultAsync(x => x.UnsubscribeToken == token && x.FlagActive);

            if (record is null)
            {
                return false;
            }

            // Tắt cờ chứ không xoá bản ghi: giữ lại để biết người này từng huỷ, khỏi
            // vô tình gửi lại cho họ.
            record.FlagActive = false;
            record.UnsubscribedDTime = TCommonUtils.DTimeNow();
            record.UpdatedDTime = TCommonUtils.DTimeNow();
            await _dbContext.SaveChangesAsync();

            return true;
        }

        // Đẩy vào RabbitMQ chứ không gửi thẳng: SMTP chậm và có lúc lỗi, để người dùng
        // ngồi đợi giữa lúc bấm nút là hỏng trải nghiệm. Consumer sẵn có lo phần gửi.
        //
        // Bọc try/catch vì email đã lưu vào DB thành công rồi - hàng đợi trục trặc
        // không được phép làm cả thao tác đăng ký báo lỗi.
        private async Task SendWelcomeMailAsync(string email, string unsubscribeToken)
        {
            try
            {
                string unsubscribeUrl = $"https://phanthang.site/unsubscribe?token={unsubscribeToken}";

                string body = $@"
                    <div style='font-family:Arial,sans-serif;font-size:15px;color:#1a1a2e;line-height:1.6'>
                        <h2 style='margin:0 0 12px'>Cảm ơn bạn đã đăng ký!</h2>
                        <p>Mỗi tuần một bài viết, một câu chuyện nhỏ, một góc nhìn khác.
                           Mình sẽ gửi thư cho bạn khi có bài mới.</p>
                        <p style='margin-top:24px'>
                            <a href='https://phanthang.site' style='color:#5b4fe9'>Ghé thăm blog</a>
                        </p>
                        <hr style='border:none;border-top:1px solid #e5e5e5;margin:24px 0' />
                        <p style='font-size:12px;color:#888'>
                            Không muốn nhận thư nữa?
                            <a href='{unsubscribeUrl}' style='color:#888'>Huỷ đăng ký</a>
                        </p>
                    </div>";

                await _emailProducer.Publish(new EmailMessageModel
                {
                    From = MAIL_FROM,
                    To = email,
                    Subject = "Cảm ơn bạn đã đăng ký theo dõi blog",
                    Body = body,
                    FromHtml = MAIL_FROM,
                    ToHtml = email
                });
            }
            catch
            {
                // Nuốt lỗi có chủ đích - xem giải thích ở trên.
            }
        }
    }
}
