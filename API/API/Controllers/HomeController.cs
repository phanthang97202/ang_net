using Microsoft.AspNetCore.Mvc;

namespace API.API.Controllers
{
    public class HomeController : Controller
    {
        [Route("")] // Match root URL
        [Route("Home")] // Match /Home
        [Route("Home/Index")] // Match /Home/Index
        public IActionResult Index()
        {
            string content = $"<!DOCTYPE html>\r\n<html lang=\"vi\">\r\n<head>\r\n    <meta charset=\"utf-8\" />\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\r\n    <title>ang_net api</title>\r\n    <!-- Bootstrap 5 CSS -->\r\n    <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\r\n    <!-- Font Awesome -->\r\n    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">\r\n</head>\r\n<body>\r\n    <!-- Hero Section -->\r\n    <section class=\"hero-section text-center mb-5\">\r\n        <div class=\"container\">\r\n            <h1 class=\"display-4 fw-bold mb-3\">Konichiwa</h1> \r\n        </div>\r\n    </section>\r\n \r\n    <!-- Call to Action -->\r\n    <section class=\"bg-light py-5\">\r\n        <div class=\"container text-center\"> \r\n            <button class=\"btn btn-primary btn-lg px-4 me-2\">\r\n                <a href=\"https://thangphan.vercel.app/register\" class=\" btn-lg px-4 me-2\">\r\n                    <i class=\"fas fa-user-plus me-2\"></i>\r\n                    Đăng kí\r\n                </a> \r\n            </button> \r\n        </div>\r\n    </section>\r\n\r\n    <!-- Bootstrap JS -->\r\n    <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js\"></script>\r\n</body>\r\n</html>";
            return Content(content, "text/html");
        }
    }
}