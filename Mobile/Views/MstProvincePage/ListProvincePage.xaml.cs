using Angnet.Maui.ApiServices;
using SharedModels.Models;
using System.Collections.ObjectModel;

namespace Angnet.Maui.Views;

public partial class ListProvincePage : ContentPage
{
    private readonly MstProvinceApiService _mstProvinceApiService;

    // Use a class-level property
    public ObservableCollection<MstProvinceModel> MstProviceModelData { get; set; }

    public ListProvincePage(MstProvinceApiService mstProvinceApiService)
    {
        InitializeComponent();
        _mstProvinceApiService = mstProvinceApiService;

        // Initialize collection
        MstProviceModelData = new ObservableCollection<MstProvinceModel>();

        // *** Set BindingContext to the entire page (Required)
        BindingContext = this;

        // Load data
        LoadData();
    }

    public async void LoadData()
    {
        List<MstProvinceModel> data = await _mstProvinceApiService.GetAllActive();

        if (data == null) return;

        // Clear and update the existing collection
        MstProviceModelData.Clear();
        foreach (var item in data)
        {
            MstProviceModelData.Add(item);
        }
    }

    private void handleAddContact(object sender, EventArgs e)
    {
         Shell.Current.GoToAsync(nameof(EditProvincePage));
    }

    private void handleEditContact(object sender, EventArgs e)
    {
       
    }

    private void listViewContracts_ItemSelected(object sender, SelectedItemChangedEventArgs e)
    {
        if (e.SelectedItem is MstProvinceModel selectedItem)
        {
            //DisplayAlert("Thông báo", selectedItem.ProvinceName, "OK");
            string provinceCode = selectedItem.ProvinceCode;
            string path = $"{nameof(EditProvincePage)}?provincecode={provinceCode}";

            Shell.Current.GoToAsync(path);
        }
    }

    private void listViewContracts_ItemTapped(object sender, ItemTappedEventArgs e)
    {
        Console.WriteLine(e);
    }
}
