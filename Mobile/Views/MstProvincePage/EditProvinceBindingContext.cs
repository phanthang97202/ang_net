using System.ComponentModel;

namespace Angnet.Maui.Views.MstProvincePage
{
    internal class EditProvinceBindingContext : INotifyPropertyChanged
    {
        private string _provinceCode;
        private string _provinceName;
        private bool _flagActive;
        private bool _isEdit;

        public string ProvinceCode
        {
            set
            {
                _provinceCode = value;
                OnPropertyChanged("ProvinceCode"); // phải thêm để khi set bindingcontext sẽ cập nhật lại vào context
            }
            get { return _provinceCode; }
        }

        public string ProvinceName
        {
            set
            {
                _provinceName = value;
                OnPropertyChanged("ProvinceName");  // phải thêm để khi set bindingcontext sẽ cập nhật lại vào context
            }
            get { return _provinceName; }
        }

        public bool FlagActive
        {
            set
            {
                _flagActive = value;
                OnPropertyChanged("FlagActive");  // phải thêm để khi set bindingcontext sẽ cập nhật lại vào context
            }
            get { return _flagActive; }
        }

        public bool IsEdit
        {
            set
            {
                _isEdit = value;
                OnPropertyChanged("IsEdit");  // phải thêm để khi set bindingcontext sẽ cập nhật lại vào context
            }
            get { return _isEdit; }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
