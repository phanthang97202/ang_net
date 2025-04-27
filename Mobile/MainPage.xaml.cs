using System.Reflection;

namespace Angnet.Maui
{
    public partial class MainPage : ContentPage
    {
        int count = 0;

        public MainPage()
        {
            Type typeContentPage = typeof(ContentPage);
            PropertyInfo[] p = typeContentPage.GetProperties();

            foreach (PropertyInfo pi in p) { 
                Console.WriteLine(pi.Name);
            }

            InitializeComponent();
        }

        private void OnCounterClicked(object sender, EventArgs e)
        {
            count++;

            if (count == 1)
                CounterBtn.Text = $"Clicked {count} time";
            else
                CounterBtn.Text = $"Clicked {count} times";
            // Hỗ trợ người khiếm thị (đọc to nội dung nút)
            SemanticScreenReader.Announce(CounterBtn.Text);
        }
         
    }

}
