using Angnet.Maui.ApiServices;
using Angnet.Maui.Views.MstProvincePage;
using SharedModels.Dtos;
using SharedModels.Models;

namespace Angnet.Maui.Views;


[QueryProperty(nameof(IsEdit), "isedit")]
[QueryProperty(nameof(ProvinceCode), "provincecode")]
public partial class EditProvincePage : ContentPage
{
    private string _provinceCode;
    private bool _isedit;
    private readonly EditProvinceBindingContext _editProvinceBindingContext;
    private readonly MstProvinceApiService _mstProvinceApiService;
    public bool IsEdit
    {
        get => _isedit;
        set
        {
            _isedit = (bool)value;
        }
    }

    public string ProvinceCode
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

        _editProvinceBindingContext = new EditProvinceBindingContext();
        BindingContext = _editProvinceBindingContext;
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
        if (_isedit == false)
        {
            _editProvinceBindingContext.ProvinceCode = "";
            _editProvinceBindingContext.ProvinceName = "";
            _editProvinceBindingContext.FlagActive = true;
            _editProvinceBindingContext.IsEdit = _isedit;
        }
        else
        {
            MstProvinceModel data = await _mstProvinceApiService.GetByCode(_provinceCode);
            if (data != null)
            {
                _editProvinceBindingContext.ProvinceCode = data.ProvinceCode;
                _editProvinceBindingContext.ProvinceName = data.ProvinceName;
                _editProvinceBindingContext.FlagActive = data.FlagActive;
                _editProvinceBindingContext.IsEdit = _isedit;
            }
        }


        // Clear and update the existing collection
        //labelProvinceDetail.Text = $"" +
        //    $"Mã tỉnh: {data.ProvinceCode} \nTên tỉnh: {data.ProvinceName} \nTrạng thái: {data.FlagActive}";
    }

    private async void handleSave(object sender, EventArgs e)
    {
        var dataForm = (EditProvinceBindingContext)BindingContext;
        Console.WriteLine(dataForm);
        MstProvinceModel province = new MstProvinceModel
        {
            ProvinceCode = dataForm.ProvinceCode,
            ProvinceName = dataForm.ProvinceName,
            FlagActive = dataForm.FlagActive
        };

        if (_isedit == true)
        {
            ApiResponse<MstProvinceModel> response = await _mstProvinceApiService.Update(province);
            await DisplayAlert("Thông báo", "Cập nhật thành công!", "OK");
        }
        else
        {
            ApiResponse<MstProvinceModel> response = await _mstProvinceApiService.Create(province);
            await DisplayAlert("Thông báo", "Thêm mới thành công!", "OK");
        }
    }
}
