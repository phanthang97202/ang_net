using Contacts.Maui.ApiServices;
using Contacts.Maui.Views;
using Microsoft.Extensions.Logging;

namespace Contacts.Maui
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();
            builder
                .UseMauiApp<App>()
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                    fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
                });

#if DEBUG
            builder.Logging.AddDebug();
#endif
            // DI
            builder.Services.AddSingleton<MstProvinceApiService>();
            builder.Services.AddTransient<ContactsPage>();
            // register http client
            builder.Services.AddHttpClient(); 
            // 
            return builder.Build();
        }
    }
}
