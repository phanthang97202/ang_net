using Angnet.Maui.ApiServices;
using SharedModels.Dtos;
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

        //// Load data
        //LoadData();
    }

    // hàm chạy ngay khi xuất hiện (giống ngOnInit() )
    protected override void OnAppearing()
    {
        base.OnAppearing();
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

    private void handleAddProvince(object sender, EventArgs e)
    {
        string path = $"{nameof(EditProvincePage)}?isedit=false";

        Shell.Current.GoToAsync(path);
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
            string path = $"{nameof(EditProvincePage)}?isedit=true&provincecode={provinceCode}";

            Shell.Current.GoToAsync(path);
        }
    }

    private void listViewContracts_ItemTapped(object sender, ItemTappedEventArgs e)
    {
        Console.WriteLine(e);
    }

    private async void handleDeleteProvince(object sender, EventArgs e)
    {
        Button button = sender as Button;
        string provinceCode = button?.CommandParameter.ToString();

        if (!string.IsNullOrEmpty(provinceCode))
        {
            ApiResponse<MstProvinceModel> response = await _mstProvinceApiService.Delete(provinceCode);
            await DisplayAlert("Thông báo", "Xóa thành công!", "OK");
            LoadData();
        }
    }
}
