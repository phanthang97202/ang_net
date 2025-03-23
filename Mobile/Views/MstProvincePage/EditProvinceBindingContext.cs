using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace Angnet.Maui.Views.MstProvincePage
{
    internal class EditProvinceBindingContext : INotifyPropertyChanged
    {
        private string _provinceCode;
        private string _provinceName;
        private bool _flagActive;

        public string ProvinceCode
        {
            set { _provinceCode = value; }
            get { return _provinceCode; }
        }

        public string ProvinceName
        {
            set { _provinceName = value; }
            get { return _provinceName; }
        }

        public bool FlagActive
        {
            set { _flagActive = value; }
            get { return _flagActive; }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
