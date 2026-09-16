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
