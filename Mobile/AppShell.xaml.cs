using Contacts.Maui.Views;

namespace Contacts.Maui
{
    public partial class AppShell : Shell
    {
        public AppShell()
        {
            InitializeComponent();
            //foreach (var item in this.Items)
            //{
            //    Console.WriteLine($"Route: {item.Route}");
            //} 

            // Chạy điều hướng sau khi Shell hoàn tất khởi tạo
            // nếu không thì MAUI sẽ không trì hoãn việc navigate khi mà Shell chưa khởi tạo xong
            //Dispatcher.Dispatch(() =>
            //{
            //    NavigateDefaultRoute();
            //});

            // nếu đã định nghĩa Route trong ShellContent thì đoạn register dưới là thừa
            Routing.RegisterRoute(nameof(ContactsPage), typeof(ContactsPage));
            Routing.RegisterRoute(nameof(EditContactPage), typeof(EditContactPage));
            Routing.RegisterRoute(nameof(AddContactPage), typeof(AddContactPage));


        }

        public async void NavigateDefaultRoute()
        {
            await Shell.Current.GoToAsync("//ContactsPage");
        }
    }
}
