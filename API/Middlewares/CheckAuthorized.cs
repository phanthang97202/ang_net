using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace API.Middlewares
{
    public class CheckAuthorized
    { 
        public static bool IsAuthorized(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var securityKey = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetSection("JWTSetting")["securityKey"];
            var issuer = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetSection("JWTSetting")["validIssuer"];
            var audience = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetSection("JWTSetting")["validAudience"];

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
