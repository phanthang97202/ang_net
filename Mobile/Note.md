### Vì sao c?n b?t Windows Hypervisor Platform và Hyper-V khi dùng .NET MAUI?
	- Khi b?n phát tri?n ?ng d?ng .NET MAUI trên Windows, n?u mu?n ch?y ?ng d?ng trên trình gi? l?p 
	Android (Android Emulator), b?n c?n b?t Windows Hypervisor Platform và Hyper-V.

	+ Hyper-V là công ngh? ?o hóa c?a Microsoft giúp t?o máy ?o (Virtual Machine - VM).
	+ Nó cho phép ch?y nhi?u h? ?i?u hành trên m?t máy tính mà không c?n kh?i ??ng l?i.
	+ Trong .NET MAUI, Hyper-V giúp ch?y trình gi? l?p Android nhanh h?n.

### Windows Hypervisor Platform là gì?
	+ Windows Hypervisor Platform (WHPX) là m?t thành ph?n giúp ?ng d?ng bên th? ba (nh? trình gi? 
	l?p Android) truy c?p vào kh? n?ng ?o hóa c?a Windows.
	+ Khi b?t WHPX, trình gi? l?p Android có th? ch?y m??t mà h?n mà không c?n dùng 
	Intel HAXM (Hypervisor c?a Intel, ch? ho?t ??ng v?i CPU Intel).
=> Cách b?t: 
	DISM /Online /Enable-Feature /All /FeatureName:Microsoft-Hyper-V
	DISM /Online /Enable-Feature /All /FeatureName:HypervisorPlatform

### Structual project
	App.xaml	Lưu trữ tài nguyên chung của ứng dụng
	App.xaml.cs	Khởi động ứng dụng, đặt trang chính (AppShell)

	AppShell.xaml	Xác định cấu trúc điều hướng (Shell)
	AppShell.xaml.cs	Xử lý logic điều hướng, đăng ký routes

	MainPage.xaml	Giao diện chính của ứng dụng
	MainPage.xaml.cs	Xử lý sự kiện, logic giao diện


IOS     |
Android |---> MauiProgram.cs ---> App ---> AppShell
Windows |

Mọi file App.xaml.cs đều có hàm InitializeComponent(); trong 
constructor để khởi tạo giao diện UI từ file .xaml tương ứng của nó

		-->	view -->
		|			|
		v			v
	state  <------	events
					
### <ContentPage>
	Là 1 loại Page dùng để hiển thị nội dung đơn giản (thường là
	Grid, ScrollView, StackLayout)
	Ex: 
		<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="Angnet.Maui.MainPage">
		+ xmlns="http://schemas.microsoft.com/dotnet/2021/maui" khai báo namespace cho .net maui, nó cho phép sử dụng các thành phần của net maui trong file xaml
		+ xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml" là khai báo namespace chuẩn, giúp sử dụng các tính năng nâng cao của xaml như: x:Class (liên kết với file C#), x:Name (định danh cho control), x:Static(Sử dụng giá trị tĩnh)
		+ x:Class="Angnet.Maui.MainPage" chỉ định tên class C# tương tứng với file xaml này, có nghĩa là MainPage.xaml được liên kết với MainPage.xaml.cs, khi chạy ứng dụng nó sẽ khởi tạo MainPage.xaml.cs rồi load file xaml từ file này

	Một số properties khác cho ContentPage
		### **1️⃣ Thuộc tính liên quan đến Giao diện & Layout**
			| Thuộc tính | Mô tả |
			|------------|--------|
			| **Padding** | Thiết lập khoảng cách bên trong `ContentPage` (giống `margin` nhưng là khoảng cách nội dung bên trong). |
			| **BackgroundColor** | Màu nền của trang. |
			| **BackgroundImageSource** | Hình nền của trang. |
			| **Content** | Thành phần chính bên trong trang (thường là `StackLayout`, `Grid`, hoặc một View khác). |
			| **Frame** | Định nghĩa khung của `ContentPage`. |
			| **Bounds** | Xác định vị trí và kích thước của `ContentPage` trong cửa sổ. |
			| **ContainerArea** | Vùng nội dung có thể sử dụng trong `ContentPage`. |

		---

		### **2️⃣ Điều khiển hành vi & Trạng thái**
			| Thuộc tính | Mô tả |
			|------------|--------|
			| **IsVisible** | Xác định xem `ContentPage` có hiển thị hay không. |
			| **IsEnabled** | Cho phép hoặc vô hiệu hóa tương tác với trang. |
			| **IsFocused** | Kiểm tra xem trang có đang được focus hay không. |
			| **IsBusy** | Hiển thị trạng thái "bận" (thường dùng để hiển thị spinner). |
			| **InputTransparent** | Nếu `true`, trang sẽ không nhận sự kiện chạm (touch events). |

		---

		### **3️⃣ Điều khiển Animation & Hiệu ứng**
			| Thuộc tính | Mô tả |
			|------------|--------|
			| **Opacity** | Điều chỉnh độ trong suốt của `ContentPage`. |
			| **Rotation, RotationX, RotationY** | Xoay trang theo các trục X, Y hoặc cả hai. |
			| **TranslationX, TranslationY** | Di chuyển trang theo trục X/Y. |
			| **Scale, ScaleX, ScaleY** | Phóng to hoặc thu nhỏ trang. |
			| **Clip** | Cắt nội dung của `ContentPage` theo một hình dạng nhất định. |
			| **Shadow** | Thêm bóng đổ cho `ContentPage`. |

		---

		### **4️⃣ Điều khiển Navigation & Menu**
			| Thuộc tính | Mô tả |
			|------------|--------|
			| **Navigation** | Cung cấp quyền truy cập vào trình điều hướng để chuyển trang. |
			| **NavigationProxy** | Hỗ trợ cho hệ thống điều hướng nội bộ của MAUI. |
			| **ToolbarItems** | Danh sách các nút trên thanh công cụ (Toolbar). |
			| **MenuBarItems** | Danh sách các mục trong thanh menu (menu bar trên macOS). |

		---

		### **5️⃣ Thuộc tính nâng cao & Tùy chỉnh**
			| Thuộc tính | Mô tả |
				|------------|--------|
				| **Effects** | Cho phép áp dụng hiệu ứng tùy chỉnh trên `ContentPage`. |
				| **Behaviors** | Gán các hành vi (behavior) mở rộng cho `ContentPage`. |
				| **Visual** | Điều chỉnh cách hiển thị UI theo nền tảng. |
				| **Style** | Xác định kiểu giao diện (CSS-like) cho trang. |

		---

		### **6️⃣ Thuộc tính Handler (Liên quan đến Native Control)**
			| Thuộc tính | Mô tả |
			|------------|--------|
			| **Handler** | Cung cấp khả năng truy cập vào lớp `Handler`, giúp tương tác với thành phần gốc trên từng nền tảng (Android, iOS, Windows). |
			| **DesiredSize** | Kích thước mong muốn của `ContentPage`. |

		---

		### **📌 Kết luận**
		🔹 **Nếu muốn tùy chỉnh giao diện?** 👉 Sử dụng **BackgroundColor, Padding, Opacity, Scale, Rotation**.  
		🔹 **Nếu muốn điều khiển trạng thái?** 👉 Kiểm tra **IsVisible, IsBusy, IsFocused**.  
		🔹 **Nếu cần điều hướng trang?** 👉 Sử dụng **Navigation, ToolbarItems, MenuBarItems**.  
		🔹 **Nếu muốn thêm hiệu ứng?** 👉 Dùng **Effects, Behaviors, Shadow**.   


### Các loại thuộc tính cần chú ý
	+ Thuộc tính bình thường của Control như: Text="Clickme", FontSize, ... Là nó chỉ áp dụng cấu hình cho control trực tiếp
	+ Thuộc tính mà có tiền tố x: như x:Name, x:Key, ..... Là nó dùng để định danh control để truy xuấ trong C#, định danh resource để tái sử dụng, code-behind ở file .xaml.cs
		✅ xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml" rất quan trọng vì:
			+ Nó cho phép sử dụng các thuộc tính x:Name, x:Key, x:Class,...
			+ Nếu không có nó, XAML sẽ báo lỗi khi gặp các thuộc tính x:.
			
			+ Đây là namespace mặc định cho các tính năng mở rộng của XAML. 🚀
				🔹 Tóm tắt - Vì sao dùng định danh dạng URL?
				✅ 1. Tránh xung đột namespace giữa các thư viện khác nhau.
				✅ 2. Theo tiêu chuẩn XML Namespaces (XMLNS) giúp dễ tích hợp với XML.
				✅ 3. Phân biệt nhà cung cấp (Microsoft, Google, Meta, AWS,...).
				✅ 4. URL không phải một trang web thật, chỉ là một định danh duy nhất giúp XAML biết namespace nào là của ai.
				🚀 Đây là một tiêu chuẩn giúp XAML có thể mở rộng và làm việc với nhiều thư viện khác nhau một cách an toàn!

			+ x chỉ là alias, bạn có thể thay bằng bất kỳ tên nào như abc, xyz, custom.
				✅ Alias giúp bạn dùng namespace theo cách ngắn gọn hơn, ví dụ: x:Name, x:Key.
				✅ Namespace chính (xmlns="") không cần alias, mọi thẻ không có prefix sẽ thuộc về

### HttpClient 
	❌ KHÔNG nên dùng TryAddWithoutValidation → có thể không ghi đè, không đảm bảo đúng định dạng.
	✅ NÊN dùng AuthenticationHeaderValue → đảm bảo header được ghi đè và đúng chuẩn.

### Navigate trong MAUI
	Trong .NET MAUI Shell, màn hình đầu tiên mà ứng dụng hiển thị khi khởi động chính là ShellContent được khai báo đầu tiên trong Shell.

	Shell là thành phần chính trong MAUI, nó không thể nằm trong thẻ ContentPage
	Phải đặt trong AppShell.xaml

	+ FlyoutItem	
		Đại diện cho một mục trong menu điều hướng (Flyout menu).
		Nếu có nhiều ShellContent bên trong, nó sẽ hiển thị các mục con.
		Dùng khi bạn muốn có một menu chính mà người dùng có thể mở từ bên trái màn hình.
	
	+ Tab	
		Dùng để nhóm các trang trong tab bar (thanh điều hướng dưới cùng màn hình).
		Chỉ dùng bên trong FlyoutItem.

	+ ShellContent	
		Là phần tử nhỏ nhất chứa nội dung thực sự của trang.
		Liên kết đến một trang cụ thể

	+ Property Route
		Route trong .NET MAUI định danh duy nhất cho một trang (ShellContent), giúp bạn có thể điều hướng đến trang đó bằng cách sử dụng tên thay vì kiểu dữ liệu trang.
		Có thể dùng GoToAsync("RouteName") để mở trang thay vì tạo instance mới.
		Có thể đăng ký Route cho trang ngoài Shell bằng Routing.RegisterRoute
	
	+ Dispatcher 
		Trong MAUI là 1 cơ chế giúp thực thi mã trên luồng UI chính (Main thread)
		Trong MAUI các thao tác UI như cập nhật giao diện, điều hướng, ... chỉ có thể thực hiện trên luồng UI chính - main thread. Nếu cố tình gọi hàm cập nhật UI từ 1 luồng nền - background thread => ứng dụng có thể bị lỗi
	
	+ Routing 
		Trong điều hướng NET MAUI có vai trò ánh xạ các route(đường dẫn) đến các page trong ứng dụng, giúp bạn điều hướng bằng cách sử dụng đường dẫn thay vì trực tiếp gọi đến lớp
		Tách biệt logic UI và logic điều hướng
		Hỗ trợ tham số trong điều hướng như khi sử dụng URL
		+ RegisterRoute 
			Dùng để đăng ký 1 route tùy chỉnh cho điều hướng (navigation)
			Tạo đường dẫn route cho 1 trang
			Cho phép sử dụng Shell.Current.GoToAsync() để điều hướng đến trang đó
			Hữu ishc khi trang không phải làm ShellContent, FlyoutItem, or Tab

			Chú ý:
				🔹 Bạn không cần RegisterRoute() nếu đã có <ShellContent Route="..." />.
				🔹 Chỉ dùng RegisterRoute() cho trang con hoặc không nằm trong Shell. 🚀
					Ex: navigate đến chi tiết của contact
						- AppShell.xaml
							<Shell
								x:Class="Angnet.Maui.AppShell"
								xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
								xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
								xmlns:views="clr-namespace:Angnet.Maui.Views"
								Shell.FlyoutBehavior="Disabled"
								Title="Angnet.Maui">

								<FlyoutItem Title="Home">
									<ShellContent Title="Main" ContentTemplate="{DataTemplate views:MainPage}" Route="MainPage"/>
									<ShellContent Title="Contacts" ContentTemplate="{DataTemplate views:ContactsPage}" Route="ContactsPage"/>
								</FlyoutItem>
							</Shell>
							* Không có ContactDetailPage trong ShellContent vì nó là trang con*
						- AppShell.xaml.cs
							public partial class AppShell : Shell
							{
								public AppShell()
								{
									InitializeComponent();

									// Đăng ký route cho trang con
									Routing.RegisterRoute("ContactDetail", typeof(ContactDetailPage));
								}
							}
							* Do ContactDetailPage không được khai báo trong ShellContent nên phải đăng ký thủ công*
						- ContactsPage.xaml.cs
							private async void OnContactSelected(object sender, EventArgs e)
							{
								var contactId = "123"; // Giả sử đây là ID của liên hệ
								await Shell.Current.GoToAsync($"ContactDetail?id={contactId}");
							}
							* GoToAsync("ContactDetail") sẽ hoạt động vì đã RegisterRoute("ContactDetail").*
						- ContactDetailPage.xaml.cs 
							protected override void OnNavigatedTo(NavigatedToEventArgs args)
							{
								base.OnNavigatedTo(args);
    
								if (Shell.Current?.CurrentState?.Location is Uri uri)
								{
									var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
									string contactId = query["id"];
									Console.WriteLine($"Contact ID: {contactId}");
								}
							}
							*Trang ContactDetailPage lấy được id từ URL.*

	+ Table
		Ex: 
			List.xaml
				<CollectionView ItemsSource="{Binding People}">
					<CollectionView.Header>
						<Grid ColumnDefinitions="*,*,*" Padding="10">
							<Label Text="Tên" FontAttributes="Bold" Grid.Column="0"/>
							<Label Text="Tuổi" FontAttributes="Bold" Grid.Column="1"/>
							<Label Text="Địa chỉ" FontAttributes="Bold" Grid.Column="2"/>
						</Grid>
					</CollectionView.Header>
    
					<CollectionView.ItemTemplate>
						<DataTemplate>
							<Grid ColumnDefinitions="*,*,*" Padding="10">
								<Label Text="{Binding Name}" Grid.Column="0"/>
								<Label Text="{Binding Age}" Grid.Column="1"/>
								<Label Text="{Binding Address}" Grid.Column="2"/>
							</Grid>
						</DataTemplate>
					</CollectionView.ItemTemplate>
				</CollectionView>
			List.xaml.cs
				public class Person
				{
					public string? Name { get; set; }
					public int Age { get; set; }
					public string? Address { get; set; }
				}

				public class MainViewModel
				{
					public ObservableCollection<Person> People { get; set; }
					public MainViewModel()
					{
						People = new ObservableCollection<Person>
						{
							new Person { Name = "A", Age = 12, Address = "Hà Nam" },
							new Person { Name = "A", Age = 12, Address = "Hà Nam" },
							new Person { Name = "A", Age = 12, Address = "Hà Nam" }
						};
					}
				}
				
				public ContactsPage()
				{
					InitializeComponent();
					BindingContext = new MainViewModel();
				}

				+ ObservableCollection<T>
					GIúp tự động cập nhật UI, thông báo cho UI khi: update, add, remove phần tử


### Lifecycle trong MAUI 

	Trong .NET MAUI, vòng đời (lifecycle) của ứng dụng và của từng trang (`Page`) hoạt động theo các sự kiện khác nhau.  

	### 🏗 **1. Lifecycle của Ứng Dụng (`App`)**  
		Là vòng đời của toàn bộ ứng dụng, được quản lý trong **`App.xaml.cs`**.  

		#### 🔹 **Các sự kiện chính của ứng dụng:**
		| 🏷 **Sự kiện** | 🎯 **Ý nghĩa** |
		|--------------|----------------|
		| **`OnStart()`** | Ứng dụng bắt đầu chạy lần đầu tiên. |
		| **`OnSleep()`** | Ứng dụng chuyển sang nền (background). |
		| **`OnResume()`** | Ứng dụng được đưa trở lại foreground. |

		#### 🚀 **Ví dụ trong `App.xaml.cs`**  
		```csharp
		public partial class App : Application
		{
			public App()
			{
				InitializeComponent();
			}

			protected override void OnStart()
			{
				// Ứng dụng bắt đầu chạy
				Console.WriteLine("App started!");
			}

			protected override void OnSleep()
			{
				// Ứng dụng vào chế độ nền
				Console.WriteLine("App sleeping...");
			}

			protected override void OnResume()
			{
				// Ứng dụng quay lại foreground
				Console.WriteLine("App resumed!");
			}
		}
		```

	---

	### 📄 **2. Lifecycle của Page (`ContentPage`)**  
		Là vòng đời của từng trang (`Page`) khi điều hướng trong ứng dụng.  

		#### 🔹 **Các phương thức quan trọng:**
		| 🏷 **Phương thức** | 🎯 **Ý nghĩa** |
		|-------------------|----------------|
		| **`OnAppearing()`** | Khi trang xuất hiện trên màn hình (tương tự `ngOnInit()` trong Angular). |
		| **`OnDisappearing()`** | Khi trang bị ẩn đi hoặc bị điều hướng khỏi. |
		| **`OnNavigatedTo()`** | Khi trang được điều hướng đến. |
		| **`OnNavigatedFrom()`** | Khi trang bị điều hướng đi. |

		#### 🚀 **Ví dụ:**
		```csharp
		public partial class EditProvincePage : ContentPage
		{
			public EditProvincePage()
			{
				InitializeComponent();
			}

			protected override void OnAppearing()
			{
				base.OnAppearing();
				Console.WriteLine("Page is appearing!");
			}

			protected override void OnDisappearing()
			{
				base.OnDisappearing();
				Console.WriteLine("Page is disappearing!");
			}

			protected override void OnNavigatedTo(NavigatedToEventArgs args)
			{
				base.OnNavigatedTo(args);
				Console.WriteLine("Navigated to this page!");
			}

			protected override void OnNavigatedFrom(NavigatedFromEventArgs args)
			{
				base.OnNavigatedFrom(args);
				Console.WriteLine("Navigated away from this page!");
			}
		}
		```

	---

	### 📱 **3. Lifecycle trên Android, iOS, Windows**  
		.NET MAUI có thể chạy trên nhiều nền tảng khác nhau, mỗi nền tảng có lifecycle riêng.  

		#### 🔹 **Android Lifecycle (`MainActivity.cs`)**  
		| 🏷 **Phương thức** | 🎯 **Ý nghĩa** |
		|-------------------|----------------|
		| `OnCreate()` | Khi Activity được tạo lần đầu. |
		| `OnStart()` | Khi Activity bắt đầu. |
		| `OnResume()` | Khi Activity tiếp tục từ background. |
		| `OnPause()` | Khi Activity bị gián đoạn (chuyển sang nền). |
		| `OnStop()` | Khi Activity không còn hiển thị. |
		| `OnDestroy()` | Khi Activity bị hủy. |

		#### 🚀 **Ví dụ trên Android (`MainActivity.cs`)**
		```csharp
		protected override void OnResume()
		{
			base.OnResume();
			Console.WriteLine("Android: App resumed!");
		}
		```

	---

	### 🎯 **Tóm lại**
	| 🏷 **Loại Lifecycle** | 🎯 **Sự kiện quan trọng** |
	|---------------------|----------------|
	| **Ứng dụng (`App`)** | `OnStart()`, `OnSleep()`, `OnResume()` |
	| **Trang (`Page`)** | `OnAppearing()`, `OnDisappearing()`, `OnNavigatedTo()`, `OnNavigatedFrom()` |
	| **Android** | `OnCreate()`, `OnStart()`, `OnResume()`, `OnPause()`, `OnStop()`, `OnDestroy()` |

	💡 **Lưu ý:**  
	- **Sử dụng `OnNavigatedTo()` khi trang cần xử lý dữ liệu từ tham số điều hướng.**  
	- **Dùng `OnAppearing()` khi muốn tải dữ liệu mỗi khi trang xuất hiện.**  
	- **Sử dụng `OnDisappearing()` để lưu trạng thái hoặc dừng các tiến trình.**  
	 