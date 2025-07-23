using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace angnet.Utility.CommonUtils
{
    public class CheckAuthorized
    {
        public static bool IsAuthorized(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();


            // Lấy môi trường hiện tại: Development, Production, v.v.
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

            // Load config dựa vào môi trường
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true) // để tránh lỗi nếu không có
                .AddJsonFile($"appsettings.{environment}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var securityKey = config["JWTSetting:securityKey"];
            var issuer = config["JWTSetting:validIssuer"];
            var audience = config["JWTSetting:validAudience"];

            //var securityKey = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetSection("JWTSetting")["securityKey"];
            //var issuer = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetSection("JWTSetting")["validIssuer"];
            //var audience = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetSection("JWTSetting")["validAudience"];

            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(securityKey)),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero // thực hiện so sánh nghiêm ngặt (bởi mặc định asp net cho phép lệch khoảng 5 phút thì vẫn coi là đúng)
                }, out SecurityToken validatedToken);

                // Token is valid
                return true;
            }
            catch (Exception)
            {
                // Token is invalid
                return false;
            }
        }
    }
}
