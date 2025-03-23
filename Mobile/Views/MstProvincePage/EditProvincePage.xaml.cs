using System.ComponentModel;
using Angnet.Maui.ApiServices;
using Angnet.Maui.Views.MstProvincePage;
using SharedModels.Models;

namespace Angnet.Maui.Views;
 

[QueryProperty(nameof(ListProvincePage), "provincecode")]
public partial class EditProvincePage : ContentPage 
{
    private string _provinceCode;
    private readonly MstProvinceApiService _mstProvinceApiService;
    public string ListProvincePage
    {
        get => _provinceCode;
        set
        {
            _provinceCode = value; 
        }
    }

    public EditProvincePage(MstProvinceApiService mstProvinceApiService)
    {
        InitializeComponent();
        _mstProvinceApiService = mstProvinceApiService;
        BindingContext = new EditProvinceBindingContext();
        //Dispatcher.Dispatch(() =>
        //{
        //    
        //});
        //LoadData();
    }

    // lifecycle Page => Excute after navigated to this page
    protected override void OnNavigatedTo(NavigatedToEventArgs args)
    {
        base.OnNavigatedTo(args);
        LoadData();
    }

    public async void LoadData()
    {
        MstProvinceModel data = await _mstProvinceApiService.GetByCode(_provinceCode);

        if (data == null) return;

        // Clear and update the existing collection
        //labelProvinceDetail.Text = $"" +
        //    $"Mã tỉnh: {data.ProvinceCode} \nTên tỉnh: {data.ProvinceName} \nTrạng thái: {data.FlagActive}";
    }  

    private void handleSave(object sender, EventArgs e)
    {
        var dataForm = BindingContext;
    }
}
