using Contacts.Maui.ApiServices;
using System.Collections.ObjectModel;

namespace Contacts.Maui.Views;

public class ContractModel
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Address { get; set; }
    public string Image { get; set; }
}

public class MainViewModel
{
    public ObservableCollection<ContractModel> ContractsData { get; set; }
    

    public MainViewModel()
    {
        ContractsData = new ObservableCollection<ContractModel>
        {
            new ContractModel { Name = "PhanThang", Age = 12, Address = "Hà Nam", Image = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyZy0ne9AUimS-ll7GXO_QDkrqj20PMG-kyw&s" },
            new ContractModel { Name = "Van Dong", Age = 12, Address = "Bắc Giang", Image = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e6724e80-59f2-45bb-88ad-dec3d19edb03/dhu6sma-d26e9d84-5997-40f4-a485-5d7a382bdfd7.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2U2NzI0ZTgwLTU5ZjItNDViYi04OGFkLWRlYzNkMTllZGIwM1wvZGh1NnNtYS1kMjZlOWQ4NC01OTk3LTQwZjQtYTQ4NS01ZDdhMzgyYmRmZDcucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.mRuA1vEsdogTArkcn689-PLMgmDDz9lCM-PV3FNu6E0" },
        }; 
    } 
}

public partial class ContactsPage : ContentPage
{
    private readonly MstProvinceApiService _mstProvinceApiService;
    public ContactsPage(MstProvinceApiService mstProvinceApiService)
	{

		InitializeComponent();
        _mstProvinceApiService = mstProvinceApiService;

        BindingContext = new MainViewModel();
    }

    private async void handleAddContact(object sender, EventArgs e)
    {
        var data = await _mstProvinceApiService.GetAllActive();
        //await Shell.Current.GoToAsync(nameof(AddContactPage));
    }

    private void handleEditContact(object sender, EventArgs e)
    {
        Shell.Current.GoToAsync(nameof(EditContactPage));
    }

    private void listViewContracts_ItemSelected(object sender, SelectedItemChangedEventArgs e)
    {
        ContractModel val = new ContractModel();

        
        if(e.SelectedItem is not null)
        {
            val = e.SelectedItem as ContractModel;
            DisplayAlert("Thông báo", val?.Name?.ToString(), "OK");
        }

    }

    private void listViewContracts_ItemTapped(object sender, ItemTappedEventArgs e)
    {
        Console.WriteLine(e);
    }
}