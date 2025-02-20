Dưới đây là danh sách các câu hỏi phỏng vấn cho vị trí Junior Developer trong các công nghệ JavaScript, ReactJS, và Angular:

### **Câu hỏi về JavaScript**

1. **JavaScript là gì và sự khác biệt giữa JavaScript và Java?**
2. **Sự khác biệt giữa `var`, `let` và `const` trong JavaScript?**
	var => Function scope, Có hoisting, có thể khai báo lại, có thể gán lại giá trị, không bất biến
	let => Block scope, có hoisting, không thể khai báo lại, có thể gán lại giá trị, không bất biến 
	const => Block scope, không có hoisting, không thể khai báo lại, không thể gán lại, bất biến (trừ object)
	
3. **Khái niệm Closure trong JavaScript là gì?**
	Closure là 1 hàm bên trong có thể truy cập các biến từ phạm vi cha của nó ngay cả khi hàm cha đã kết thúc
	Hay nói cách khác: 1 closure ghi nhớ và có thể sử dụng lại biến từ phạm vi cha nó được tạo ra
	+ Có thể truy cập biến từ phạm vi cha
	+ Có thể tạo biến private 
		function createCounter() {
			let count = 0; // Biến private

			return {
				increment: function() {
					count++;
					console.log(count);
				},
				decrement: function() {
					count--;
					console.log(count);
				},
				getCount: function() {
					return count;
				}
			};
		}

		const counter = createCounter();
		counter.increment(); // 1
		counter.increment(); // 2
		counter.decrement(); // 1
		console.log(counter.getCount()); // 1
		console.log(counter.count); // undefined (Không thể truy cập trực tiếp)

	+ Ghi nhớ giá trị các biến sau mỗi lần gọi, hạn chế việc tạo lại biến 
	
4. **Giải thích sự khác biệt giữa `==` và `===` trong JavaScript?**
	== so sánh giá trị, === so sánh giá trị và kiểu dữ liệu
	+ == sẽ chuyển đổi kiểu dữ liệu của 2 biến về cùng 1 kiểu rồi so sánh giá trị
	+ === so sánh giá trị và kiểu dữ liệu của 2 biến
	+ Ví dụ: 
		0 == '0' // true
		0 === '0' // false

5. **Event Delegation trong JavaScript là gì?**
	Event delegation(ủy quyền sự kiện) là một kỹ thuật  trong js giúp gắn 1 sự kiện vào
		1 phần tử cha thay vì gắn trực tiếp vào phần tử con
	Khi này chúng ta sẽ dùng event.target.tagName để check xem đã click vào phần tử con mong muốn chưa 
	Nếu muốn Bubble từ cha rồi mới đến con thì dùng useCapture: true vào đối số thứ 3 của event (mặc định là false)
	Link: https://anonystick.com/blog-developer/event-delegation-bubbling-va-capturing-la-gi-2021080190413958
	Example: 
		<ul class="parent_ul">
			<li>1</li>
			<li>2</li>
			<li>
				3
				<ul>
					<li>3.1</li>
					<li>3.2</li>
					<li>3.3</li>
				</ul>
			</li>
		</ul>

		<ul class="parent_ul2">
			<li>Item 1</li>
			<li>Item 2</li>
		</ul>
		const parent_ul = document.querySelector(".parent_ul");
		parent_ul.addEventListener("click", function (e) {
			if (e.target.tagName === "LI") {
				console.log("====li====", e.target.innerText);
				e.target.style.color = "white";
			}
		});

		document.querySelector(".parent_ul2").addEventListener("click", () => {
			console.log("📌 UL clicked");
		});

		document.querySelectorAll("li").forEach((li) => {
			li.addEventListener("click", (e) => {
				console.log("🔹 LI clicked");
				e.stopPropagation();
			});
		});

6. **Sự khác biệt giữa `null` và `undefined` trong JavaScript?**
	null được định nghĩa có chủ ý, sau này có thể gán lại 
	undefined được js tự động gán khi 1 biến chưa được khởi tạo hoặc không có giá trị trả về

7. **Giải thích cách hoạt động của `this` trong JavaScript.**
	+ this trong phạm vi toàn cục => window
	+ this trong object: 
		+ this trỏ tới object chứa nó
			const person = {
				name: "John",
				getName: function () {
					console.log(this.name); // 👉 "John"
				}
			};
			person.getName();
	+ this trong constructor function => trỏ tới instance mới được tạo ra 
		function Person(name) {
			this.name = name;
		}
		const user = new Person("Alice");
		console.log(user.name); // 👉 "Alice"
	+ this trong class => trỏ tới instance mới được tạo ra 
		class Animal {
			constructor(name) {
				this.name = name;
			}
			speak() {
				console.log(`${this.name} makes a sound.`);
			}
		}
		const cat = new Animal("Kitty");
		cat.speak(); // 👉 "Kitty makes a sound."
	+ this trong arrow function => trỏ tới this của phạm vi bên ngoài
		const person = {
			name: "John",
			getName: () => {
				console.log(this.name);
			}
		};
		person.getName(); // 👉 undefined (vì `this` trỏ đến `window`)
	+ this trong event handler => trỏ tới element gọi event
		const button = document.querySelector("button");
		button.addEventListener("click", function () {
			console.log(this); // 👉 button element
		});
	+ this trong Call, Apply, Bind 
		chúng ta có thể ép this trỏ đến obj mong muốn bằng call, bind, apply 
		function sayHello() {
			console.log(`Hello, ${this.name}`);
		}
		const user = { name: "Alice" };
		sayHello.call(user); // 👉 "Hello, Alice"
		sayHello.apply(user); // 👉 "Hello, Alice"
		const boundFunc = sayHello.bind(user);
		boundFunc(); // 👉 "Hello, Alice"

8. **Sự khác biệt giữa các phương thức `map`, `filter`, và `reduce` trong JavaScript?**
	map => lặp qua từng phần tử, trả về 1 mảng mới, không thay đổi mảng ban đầu 
	filter => lọc các phần tử mảng ban đầu, chỉ lấy các phần tử thỏa mãn, không thay đổi mảng ban đầu 
	ruduce => lặp qua mảng và tích lũy kết quả sau mỗi lần lặp, không thay đổi mảng ban đầu 

9. **JavaScript có các kiểu dữ liệu nào và cách chuyển đổi giữa chúng?**
	Number => String(num), num.toString()
	String => Number(str), +str 
	Boolean
	Null 
	Undefined 
	Object: Array, Object, Date
10. **Làm thế nào để tạo một đối tượng trong JavaScript?**
	+ Khai báo trực tiếp dùng Object Literal
		const person = {
			name: "Alice",
			age: 25,
			isStudent: false,
			greet: function() {
				console.log(`Hello, my name is ${this.name}`);
			}
		};
		console.log(person.name);  // Alice
		person.greet();  // Hello, my name is Alice
	+ Dùng new Object()
		const person = new Object();
		person.name = "Bob";
		person.age = 30;
		person.greet = function() {
		console.log(`Hello, my name is ${this.name}`);
		};
		console.log(person.name);  // Bob
		person.greet();  // Hello, my name is Bob
	+ Dùng constructor function
		function Person(name, age) {
			this.name = name;
			this.age = age;
			this.greet = function() {
				console.log(`Hello, my name is ${this.name}`);
			};
		}
		const person = new Person("Alice", 25);
		console.log(person.name);  // Alice
		person.greet();  // Hello, my name is Alice
	+ Dùng class
		class Person {
			constructor(name, age) {
				this.name = name;
				this.age = age;
			}

			greet() {
				console.log(`Hi, I'm ${this.name}`);
			}
	    }
		const person1 = new Person("Emma", 22);
		console.log(person1.name);  // Emma
		person1.greet();  // Hi, I'm Emma
	+ Dùng JSON
		const person = JSON.parse('{"name": "Alice", "age": 25}');
		console.log(person.name);  // Alice
	+ Dùng Object.create()
		const person = Object.create(null);
		person.name = "Alice";
		person.age = 25;
		console.log(person.name);  // Alice

11. **Giải thích về `promises` và cách sử dụng `async/await`.**
	Promise là một đối tượng trong javascript dùng để xử lý các thao
		tác bất đồng bộ (asynchronous): call api, đọc file, setTimout 
	+ 3 trạng thái của promise:
		- Pending (đang chờ): Khi tạo ra promise
		- Fulfilled (hoàn thành): Khi thực thi thành công
		- Rejected (thất bại): Khi thực thi thất bại
	Ex:
		const myPromise = new Promise((resolve, reject) => {
			setTimeout(() => {
				let success = true; // Thay đổi giá trị này để test
				if (success) {
				resolve("Dữ liệu đã tải thành công!");
				} else {
				reject("Lỗi khi tải dữ liệu!");
				}
			}, 2000);
		});

		// Xử lý Promise bằng .then() và .catch()
		myPromise
		.then(result => {
			console.log(result); // "Dữ liệu đã tải thành công!"
		})
		.catch(error => {
			console.error(error); // "Lỗi khi tải dữ liệu!"
		})
		.final(() => {
			console.log("Kết thúc xử lý Promise!");
		});
	
	async/await giúp viết mã bất đồng bộ dễ đọc hơn so với then và catch 
		+ async: định nghĩa 1 hàm bất đồng bộ 
		+ await: dùng trong hàm async để chờ cho đến khi promise được giải quyết
	Promise.all chạy các promise song song, giúp tối ưu hiệu suất, 1 trong promise bị lỗi => Lỗi luôn toàn bộ
	Promise.race chạy các promise đồng thời nhưng chỉ lấy kết quả từ promise nào hoàn thành trước (fullfill hoặc rejected)
		Ex: 
		function fetchData() {
			return new Promise((resolve) => setTimeout(() => resolve("Dữ liệu tải xong"), 5000));
		}
		function timeout(delay) {
			return new Promise((_, reject) => setTimeout(() => reject("Quá thời gian chờ!"), delay));
		}
		Promise.race([fetchData(), timeout(3000)])
			.then(data => console.log(data))
			.catch(error => console.error(error));
	Promise.allSettled(iterable) chạy tất cả promise và trả về 1 mảng chưa trạng thái fullfilled hoặc rejected của từng promise 
		Ex: 
			const p1 = Promise.resolve("Thành công!");
			const p2 = Promise.reject("Lỗi rồi!");
			const p3 = new Promise((resolve) => setTimeout(() => resolve("Xong rồi!"), 1000));
			Promise.allSettled([p1, p2, p3]).then(console.log);
			/*
			[
				{ status: 'fulfilled', value: 'Thành công!' },
				{ status: 'rejected', reason: 'Lỗi rồi!' },
				{ status: 'fulfilled', value: 'Xong rồi!' }
			]
			*/
	Promise.any trả về kết quả đầu tiên được fullfilled, nếu tất cả reject thì trả về lỗi 
		Ex: 
			const p1 = Promise.reject("❌ Lỗi P1");
			const p2 = new Promise((resolve) => setTimeout(() => resolve("✅ P2 OK!"), 2000));
			const p3 = Promise.reject("❌ Lỗi P3");
			Promise.any([p1, p2, p3]).then(console.log); // ✅ P2 OK! (sau 2 giây)
		  
12. **Khái niệm về Hoisting trong JavaScript?**
	Hoisting là cơ chế tự động đưa phần khai báo của biến var, let, const 
		và hàm function declaration lên đầu phạm vi (scope) trước khi thực thi mã 
	+ func declaration được hoisted toàn bộ cả khai báo lẫn định nghĩa
	+ var chỉ hoisted phần khai báo, không hoisted giá trị 
	+ const và let cũng được hoisted nhưng không thể sử dujgn trước khi khai báo 

13. **Sự khác biệt giữa các phương thức `call()`, `apply()`, và `bind()` trong JavaScript?**
	https://codesandbox.io/p/sandbox/dawn-sunset-zvpwxr?file=%2Fsrc%2Findex.js%3A1%2C1-3%2C18

14. **Sự khác biệt giữa `forEach()` và `map()` trong JavaScript?**
	foreach lặp qua từng phần tử của mảng nhưng không trả về giá trị, không tạo mảng mới
	map lặp qua từng phần tử của mảng, có trả về 1 mảng mới, k làm thay đổi mảng gốc 

15. **Thế nào là callback function trong JavaScript và khi nào chúng ta sử dụng chúng?**
	Là 1 hàm và được gọi thông qua đối số của hàm khác 
	Xử lý bất đồng bộ, khi cần thực hiện 1 hành động sau khi hành động khác kết thúc 
	Ex: 
		const getApi = (id, callback) => {
			callback(id)
		}

		getApi(1, (id) => {
			getApi(2, (id) => {
				getApi(3, id => {
					console.log('id', id)
				})
			})
		})

		const getApi2 = (data: any): Promise<any> => {
			return  new Promise((rs, rj) => {
				setTimeout(() => {
					console.log("🚀 ~ setTimeout ~ data:", data)
					rs(data)
				}, 2000)
			})
		}

		getApi2(1)
			.then((d: any) => { 
				return getApi2(2)
			})
			.then((d: any) => { 
				return getApi2(3)
			})

16. **Giải thích về Event Loop trong JavaScript?**
	Event loop là một cơ chế quan trọng giúp js xử lý bất đồng bộ hiệu quả, đặc biệt là trong môi trường
	đơn luồng(single thread). nó cho phép js không bị chặn(non-blocking) khi thực hiên các tác vụ xử lý sự kiện, gọi api hoặc thực thi các tác vụ bất đồng bộ khác

17. **Làm thế nào để kiểm tra một đối tượng có phải là một mảng trong JavaScript?**
	Array.isArray(obj)

18. **Truthy và Falsy trong JavaScript là gì?**
	Falsy: false, null, undefined, 0, "", NaN
	Truthy: là các thứ còn lại
	?? là nếu null hoặc undefined thì lấy vế sau
	|| là nếu falsy thì lấy vế sau
19. **for...in và for...of**
	for in dùng để duyệt qua idex của mảng, key của objectm 
	Ex: 	
		const user = { name: "Alice", age: 25, city: "Paris" };
		for (let key in user) {
			console.log(key);
		} // output: name, age, city 
	for of dùng để duyệt qua các value của iterable (Array, Map, Set, String)
		, không duyệt qua object (Object.entries(obj) thì được)
	Ex: 
		const fruits = ["apple", "banana", "cherry"];
		for (let fruit of fruits) {
			console.log(fruit);
		} // output: apple, banana, cherry
		for (let char of "hel") {
			console.log(char);
		} // output: h, e, l
		const numbers = new Set([10, 20, 30]);
		for (let num of numbers) {
			console.log(num);
		} // output: 10, 20, 30

20. **Currying func là gì**
	Hàm có nhiều tham số được chuyển thành chuỗi các hàm, mỗi lần chỉ nhận 1 tham số
	Ex: 
		function add(a) {
			return function (b) {
				return function (c) {
					return a + b + c;
				};
			};	
		}
		console.log(add(1)(2)(3)); // 6

### **Câu hỏi về ReactJS**

## **1. Câu hỏi về React cơ bản**
1. **React là gì?**  
2. React có gì khác so với JavaScript thuần?  
3. React có phải là một framework không? Nếu không thì nó là gì?  
4. JSX là gì? JSX có bắt buộc phải sử dụng trong React không?  
	JSX cho phép bạn viết code giống như HTML bên trong JS 
	có thể dùng:
		const element = React.createElement("h1", null, "Chào mừng đến với React!");
		ReactDOM.createRoot(document.getElementById("root")).render(element);

5. Component trong React là gì? Có mấy loại Component?  
	Component là thành phần nhỏ trong giao diện của ứng dụng React. Mỗi component có thể tái sử dụng và hoạt động độc lập, giúp chia nhỏ UI thành các phần nhỏ hơn để dễ quản lý.
	Functional Component (hàm) ➝ Hiện đại, tối ưu, dùng Hooks.
	Class Component (lớp) ➝ Cũ, ít dùng hơn.

6. Functional Component khác gì so với Class Component?

7. Tại sao nên sử dụng Functional Component thay vì Class Component?  
8. Props trong React là gì?  
	Props có thể là bất kiểu dữ liệu gì: string, number, boolean, object, function, ...
	Giúp truyefn dữ liệu từ con xuống cha và ngược lại(callback)
	Đặt được giá trị mặc định nếu props k được truyền
	Là immutable (không thể thay đổi bên trong component)
	Children props là 1 prop đặc biệt:
		Giúp chèn nội dung bên trong component mà không cần thông qua prop như thông thường 
		Có thể là bất kì kiểu dữ liệu nào

9. State trong React là gì? Props khác gì so với State?  
	Dùng useState hook 
	Quản lý dữ liệu bên trong component 
	Có thể thay đổi dữ liệu
	Render lại ui khi state thay đổi
	Luồng chạy:
		1	Gọi setState(prev => prev + 1)
		2	React kiểm tra state mới khác state cũ không
		3	Nếu khác → Component chạy lại từ đầu
		4	React so sánh Virtual DOM cũ và mới
		5	React cập nhật UI
10. Khi nào nên dùng Props, khi nào nên dùng State? 
	state: khi dữ liệu thay đổi bên trong component 
	props: truyền dữ liệu từ cha xuống con và ngược lại 
	
11. Virtual DOM là gì? Nó hoạt động như thế nào?  
	Virtual DOM là 1 bản sao của DOM thật, nhưng tồn tại dưới dạng cấu trúc dữ liệu js trong bộ nhớ
	React sử dụng virtual dom để tối ưu hóa quá trình cập nhật UI
	Thay vì thao tác trực tiếp trên DOM, React cập nhật trên virtual dom trước, sau đó chỉ thay đổi những phần cần thiết trên DOM thật

12. Key trong React là gì? Tại sao cần dùng key khi render danh sách?  
	Key giúp react phân biệt các phần tử trong danh sách khi chúng thay đổi
	Mỗi key phải là duy nhất trong danh sách
	Tác dụng:
		Xác định chính xác phần tử nào cập nhật, thay đổi or xóa
		Giảm số lần thao tác DOM k cần thiết
		Nếu k có sẽ dẫn đến tình huống cập nhật sai phần tử khi thay đổi => Sai UI
13. Reconciliation trong React hoạt động như thế nào?  

---

## **2. Câu hỏi về React Hooks**
14. React Hooks là gì?  
15. React Hooks được giới thiệu từ phiên bản nào của React?  
16. useState() hoạt động như thế nào?  
	Component mount, initial state được lấy ra để dùng
	Khi setState 
		+ So sánh giá trị mới và cũ
			+ Giống nhau => Bỏ qua re render
			+ KHác nhau +> React cập nhật state và re render component
	Gọi lại func component từ đầu

17. useEffect() hoạt động như thế nào? Khi nào useEffect bị gọi? 
18. useEffect có mấy cách sử dụng dependency array?  
19. Sự khác biệt giữa useEffect với dependency `[]`, `[value]`, và không có dependency?
	useEffect trong react thực hiện các side effects:
		Fetch API
		Event listener
		Thao tác với DOM trực tiếp
		interval, setTimeout
		Cleanup
	Bị gọi khi: 
		+ Không có dependency => Chạy 1 lần duy nhất khi mounted, không chạy lại khi component re render
		+ Không có [] => Chạy mỗi lần re render
		+ Có dependency => Chỉ chạy khi giá trị trong dependence thay đổi
	useEffect trả về 1 func 
		+ Nó sẽ chạy mỗi khi component unmounted và trước khi chạy effect mới
	
	Luồng chạy:
		Component mounted => Render DOM
		Sau đó mới chạy callback của useEffect
	Cảnh báo: không đặt những sideeffect ra ngoài useEffect vì nếu nó là 1 hành động gây mát thời gian sẽ gây chặn việc render ui 
	Ex: 
		function PreviousValue() {
			const [count, setCount] = useState(0);
			const prevCount = useRef(count); // Lưu giá trị trước đó

			useEffect(() => {
				prevCount.current = count; // Cập nhật giá trị trước khi render mới
			}, [count]);

			return (
				<div>
					<p>Giá trị trước đó: {prevCount.current}</p>
					<p>Giá trị hiện tại: {count}</p>
					<button onClick={() => setCount(count + 1)}>Tăng</button>
				</div>
			);
		}
		Luồng chạy: 
			Component mounted 
				+ Chạy từ trên xuống dưới
				+ initial state count = 0, ref prevCount = 0 (initial của useState và useRef chỉ chạy đúng 1 lần khi component mounted)
				+ Render UI
				+ callback useEffect chạy
			Click Tăng => set state 
				+ useState thấy sự khác nhau => Component được gọi lại
				+ count lúc này = 1
				+ render ui => Giá trị trước đó: 0
							=> Giá trị hiện tại: 1
				+ gọi callback useffect vì dependence thay đổi => update prevCount.current = 1
20. useRef() hoạt động như thế nào? Khi nào nên sử dụng useRef?
	Lưu 1 giá trị tham chiếu không bị re render khi state thay đổi
	Dùng để: 
		Truy cập trực tiếp đến DOM 
		Lưu biến mà không làm componetn re render
		Giữ các giá trị giữa những lần render mà k bị mất khi state thay đổi
	

21. useContext() dùng để làm gì? Khi nào nên dùng useContext?  
	Là một hook giúp truy cập dữ liệu từ Context mà không cần truyền qua nhiều câp bằng props. thay vì phải truyền nhiều cấp từ cha xuống con

	const ThemeContext = createContext()
	export function ThemeProvider({children}) {
		const [theme, setTheme] = useState('light')
		return (
			<ThemeContext.Provider value={{theme, setTheme}}>
				{children}
			</ThemeContext.Provider>
		)
	}
	const ThemeSwitcher() {
		const {theme, setTheme} = useContext(ThemeProvider)
		return (
			<div>
				<p>Chủ đề hiện tại: {theme}</p>
				<button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
					Chuyển đổi chủ đề
				</button>
			</div>
		)
	}

22. useReducer() là gì? So với useState thì khác gì?  
	Giúp quản lý state phúc tạp hơn useState
	const reducer = (state, payload) => {
		switch(payload.type) {
			case "i": 
				return {count: state.count + 1}
			case "d": 
				return {count: state.count - 1}
			default: 
				return state
		}
	}
	function Counter () {
		const [state, dispatch] = useReducer(reducer, {count: 0})
		return(
			<div>
				<p>{state.count}</p>
				<button onClick={() => dispatch({type: "i"})} >Tăng</button>
				<button onClick={() => dispatch({type: "d"})} >Giảm</button>
			</div>
		)
	}

23. useMemo() là gì? Khi nào nên dùng useMemo?  
	Giúp tối ưu hiệu suất bằng cách ghi nhớ giá trị đã tính toán trước đó, tránh việc tính toán lại không cần thiết khi cmp re render
	Sử dụng: 
		Khi tính toán phức tạp, tốn thời gian
		Khi render danh sách có sorting, filter phức tạp
		Khi cần tối ưu hiệu suất tránh re render k cần thiết

24. useCallback() khác gì so với useMemo()?  
25. React có hỗ trợ custom hooks không? Nếu có thì làm thế nào để tạo custom hooks?  
26. So sánh useLayoutEffect và useEffect
	useEffect
		Cập nhật lại state
		Cập nhật DOM mutated (tức là chạy ngầm update DOM nhưng chưa render vội ra UI )
		Render lại UI
		Gọi cleanup nếu deps thay đổi
		Gọi callback useEffect
	Ex: 
		const App = () => {
			const [count, setCount] = useState(0);
			const [a, setA] = useState(0);
			console.log("🟢 Render UI với count =", count);
			useEffect(() => {
				console.log("🔵 useEffect chạy (sau khi UI render)");
				setA((prev) => prev + 1);
				return () =>
				console.log("🔴 Cleanup useEffect (trước khi chạy useEffect mới)");
			}, [count]);  
			return (
				<div>
					<h1>Count: {count}</h1>
					<h1>a: {a}</h1>
					<button onClick={() => setCount(count + 1)}>Tăng Count</button>
					{console.log("render jsx")}
				</div>
			);
		};
		Output: 
			🟢 Render UI với count = 2
			render jsx
			🔴 Cleanup useEffect (trước khi chạy useEffect mới)
			🔵 useEffect chạy (sau khi UI render)
			🟢 Render UI với count = 2
			render jsx
		Giải thích luồng: 
			Click setCount = 1
			Component re render 
			count lúc này là 1
			Chạy xuống mutated lại DOM rồi render UI luôn
			Sau đó mới chạy cleanup func của useEffect nếu có
			Cuối cùng, chạy callback useEffect

	useLayoutEffect (nói chung là chạy đồng bộ code)
		Cập nhật lại state
		Cập nhật DOM mutated (tức là chạy ngầm update DOM nhưng chưa render vội ra UI )
		Gọi cleanup nếu deps thay đổi (sync)
		Gọi callback useLayoutEffect (sync)
		Render lại UI
		Ex: 
			const App = () => {
				const [count, setCount] = useState(0);

				console.log("count", count);

				useEffect(() => {
					console.log("🟣 useLayoutEffect: Trước khi UI vẽ");
					document.getElementById("box").style.width = `${count * 10 + 100}px`;
				}, [count]);
				console.log("count 2", count);
				return (
					<div>
						{console.log("render jsx")}
						<div id="box" style={{ height: "50px", background: "blue" }}>
							Box
						</div>
						<button onClick={() => setCount(count + 1)}>Tăng count</button>
					</div>
				);
			};
		Giải thích luồng: 
			Click setCount => Component re render
			count lúc này là 1 => chạy xuống mutated lại DOM NHƯNG CHƯA VỘI RENDER RA UI
			Tiếp theo mới chạy useEffect cleanup (nếu có)
			Chạy callback useLayoutEffect xong
			Thì mới render lại UI
---

## **3. Câu hỏi về React Router**
26. React Router là gì?  
	Là 1 thư viện điều hướng (routing), giúp bạn chuyển đổi giữa các trang mà không cần phải tạo lại toàn bộ trang web
	Cho phép nested route, protected route
	Có thể sử dụng useNavigate, useParams, useLocation để điều hướng

27. Làm thế nào để định nghĩa routes trong React Router?  
	BrowserRouter: định nghĩa hệ thống router
	Routes: chứa các route
	Route: định nghĩa các route cho component

28. `useNavigate` trong React Router dùng để làm gì?  
	Hook này giúp điều hướng giữa các trang trong REact mà không cần tải lại trang
	Ex: 
		const navigate = useNavigate()
		navigate(path, options)
			path: đường muốn chuyển đến
			options: 
				{replace: true}: thay thế trang hiện tại, không thể quay lại bằng nút back
				{state: object}: truyền dữ liệu qua navigation rồi dùng useLocation().state để nhận dữ liệu
29. `useParams` dùng để lấy dữ liệu gì trong URL?  
	Dùng để lấy tham số động từ URL

30. `useLocation` trong React Router dùng để làm gì?  
	Để lấy thông tin đường dẫn hiện tại của URL gồm: 
		pathname: đường dẫn hiện tại
		search: query string sau chuỗi ?
		hash: phần hash trong url (#hash dùng để xác định phần cụ thể trang web mà không cần reload)
		state: dữ liệu được truyền khi điều hướng

31. Sự khác nhau giữa `<Link>` và `<a>` trong React Router? 
	Link điều hướng nội bộ trong react router, không reload lại trang, nhanh, giữ nguyên state, context của ứng dụng

	a tải lại toàn bộ trang, chậm, mất state, context do phải load lại

32. Có cách nào để bảo vệ một route trong React không (Protected Routes)?  
	const ProtectedRouter = ({isAuthenticated}) => {
		return isAuthenticated ? <Outlet /> : <Navigate to="/login" />
	}

---

## **4. Câu hỏi về Quản lý State trong React**
33. Redux là gì? Tại sao cần dùng Redux?  
34. Redux hoạt động như thế nào? Các thành phần chính của Redux là gì?  
	+ Connect redux 
		<Provider store = {store}>
			<App />
		</Provider>
	+ Cấu hình redux store
		export const store = configureStore({
			reducer: {
				"cart": cartReducer
			}
		})
	+ Tạo slice cho cart
		const cartSlice = createSlice({
			name: "cart",
			intialState: [],
			reducers: {
				addToCart: (state, action) => {
					const {payload} = action;
					// your logic
				},
				.....
			}
		})
		export const {addToCart} = cartSlice.actions
		export default cartSlice.reducer
	+ Sử dụng
		Dispatch gửi action để cập nhật state: 
			useDispatch(addToCart(product))
		Get data from redux store:
			useSelector(state => state.cart)

35. React Context API là gì? Khi nào nên sử dụng Context API thay vì Redux?  

36. Sự khác nhau giữa Redux Toolkit và Redux truyền thống?  
37. useSelector() và useDispatch() trong Redux dùng để làm gì?  
38. Middleware trong Redux là gì? Một số ví dụ về middleware phổ biến?  
	Redux thunk: xử lý các tác vụ bất đồng bộ

39. Redux Thunk là gì? So với Redux Saga thì khác gì?  
40. Khi nào nên sử dụng Redux, khi nào không nên?  

---

## **5. Câu hỏi về Hiệu suất trong React**
41. Khi nào cần tối ưu hiệu suất trong React?  
42. React memo là gì? Nó giúp tối ưu hiệu suất như thế nào?  
43. React.memo() có tác dụng gì?  
44. Khi nào nên dùng useMemo() để tối ưu hiệu suất?  
45. useCallback() có tác dụng gì trong việc tối ưu hiệu suất?  
46. Tại sao không nên cập nhật state liên tục trong một component?  
47. Khi nào React re-renders một component?  
48. HOC (Higher Order Component) là gì? Nó giúp ích gì trong việc tối ưu code?  
	HOC là:
		+ 1 hàm nhận vào component
		+ Trả về 1 component mới với props được mở rộng or thay đổi
	Ex: 
		const DashboardPage = ({ user }) => {
			return <>Dashboard</>
		}

		const withPermission = (WrappedComponent) => {
			const checkPermission = (props) => {
				if(props.user) {
					return <WrapperComponent {...props} yes={{true}}>
				}
				return <>Vui lòng đăng nhập<>
			}
		}

		const ProtectedDashboard = withPermission(DashboardPage)

		const App = () => {
			const user = localStorage.getItem('user')
			return (
				<ProtectedDashboard user = {user}/>
			)
		}

49. Khi nào cần sử dụng lazy loading trong React?
	Là kỹ thuật trì hoãn việc tải 1 phần của ứng dụng cho đến khi nó thực sự cần thiết
	Kết hợp React.lazy() + Suspense giúp tải component chỉ khi nó được sử dụng

	const Modal = lazy(() => import("./modal"))
	function App() {
		return (
			<Suspense fallback={<div> Đang tải... </div>}>
				<Modal />
			</Suspense>
		)
	}
---

## **6. Câu hỏi về Xử lý Sự kiện và Form**
50. React xử lý sự kiện (event handling) như thế nào?  
51. Synthetic Events trong React là gì?  
52. Làm thế nào để binding `this` trong Class Component?  
53. Controlled Component và Uncontrolled Component trong React khác nhau như thế nào?  
	Controlled Component
		React kiểm soát thông qua state
		Lấy value thông qua event
		Cập nhật state liên tục
		Dễ validation
		Phù hợp với form phức tạp, cần kiểm tra dữ liệu
	Uncontrolled Component
		DOM tự kiểm soát
		Lấy value thông qua ref (useRef)
		Hiệu suất tốt
		Khó validation
		Phù hợp với form đơn giản  k cần check

54. Cách sử dụng useRef() để lấy giá trị input trong Uncontrolled Component?  
55. Làm thế nào để xử lý form validation trong React?  
56. Thư viện nào có thể dùng để quản lý form trong React?  

---

## **7. Câu hỏi về API, Fetching Data và Lifecycle**
57. React có các giai đoạn Lifecycle nào?  
	Mounting: render lần đầu tiên
	Updating: Khi state or props thay đổi
	Unmounting: Khi bị xóa khỏi giao diện

58. useEffect() có thể thay thế componentDidMount không?  
59. Fetching data trong React như thế nào?  
60. Cách xử lý API call trong useEffect()?  
	Có thể s.dụng AbortController để hủy call api khi component unmounted
	Ex: 
		useEffect(() => {
			const controller = new AbortController();
			const signal = controller.signal;

			const fetchData = async () => {
				try {
					const response = await fetch("https://jsonplaceholder.typicode.com/posts", { signal });
					if (!response.ok) throw new Error("Lỗi khi fetch dữ liệu!");
					const result = await response.json();
					setData(result);
				} catch (error) {
					if (error.name !== "AbortError") setError(error.message);
				} finally {
					setLoading(false);
				}
			};

			fetchData();

			return () => controller.abort(); // Cleanup function huỷ request nếu component unmount
		}, []);

61. Sự khác biệt giữa fetch API và thư viện Axios?  
62. useSWR và React Query là gì? Khi nào nên dùng chúng thay vì fetch API?  
63. Làm thế nào để xử lý lỗi khi gọi API trong React?  
64. Khi nào nên sử dụng WebSocket thay vì HTTP request?  

---

## **8. Câu hỏi về React Styling**
65. Các cách styling trong React?  
66. Styled Components là gì? Khi nào nên dùng Styled Components?  
67. Tailwind CSS có thể sử dụng với React không?  
68. CSS Modules là gì? Khác gì so với CSS truyền thống?  
69. Emotion và Styled Components có khác gì nhau?  
70. Khi nào nên dùng inline styles thay vì CSS bên ngoài?  

---

## **9. Câu hỏi về Testing trong React**
71. React Testing Library là gì? Khác gì với Enzyme?  
72. Làm thế nào để test một React Component?  
73. Jest là gì? Khi nào nên dùng Jest?  
74. Làm sao để mock API trong testing?  

---

## **10. Câu hỏi về Deployment và CI/CD**
75. Làm thế nào để build ứng dụng React cho production?  
76. Cách deploy React App lên Netlify, Vercel, hoặc Firebase Hosting?  
77. Sự khác nhau giữa build và start trong React?  
78. Service Worker là gì? Khi nào nên dùng Service Worker trong React?  
79. Làm sao để cấu hình môi trường `.env` trong React?  
80. Progressive Web App (PWA) là gì? Làm thế nào để tạo một PWA với React?  

---
 
### **Câu hỏi về Angular** 

## **1. Câu hỏi về Angular cơ bản**
1. Angular là gì?  
2. Angular có phải là framework không? Nó khác gì với React hoặc Vue?  
3. Các phiên bản chính của Angular từ v2 đến v17 có gì khác nhau không?  
4. **Single Page Application (SPA)** là gì? Angular hỗ trợ SPA như thế nào?  
5. TypeScript là gì? Tại sao Angular sử dụng TypeScript thay vì JavaScript thuần?  
6. **Component trong Angular** là gì? Cấu trúc của một component gồm những gì?  
	Mỗi component bao gồm: 
		HTML Template
		CSS Style
		Typescript: Xử lý logic, dữ liệu, sự kiện
		Metadata
7. **Module trong Angular** là gì? Khi nào cần tạo một module mới?  
	Module là một cách tổ chức mã nguồn, giúp quản lý các thành phần (component, directive, pipe, service) trong ứng dụng
	Một module angular gồm 4 thành phần chính: 
		declaration: khai báo các component, directive, pipe
		import: import các module khác
		provider: khai báo các service
		bootstrap: xác định component gốc của module

8. **NgModule** là gì? Tại sao cần AppModule trong Angular?  
9. **Directives trong Angular** là gì? Angular có những loại directives nào?
	Là một tính năng mạnh mẽ của Angular giúp thao tác với DOM bằng cách thay đổi giao diện hoặc hành vi của phần tử HTML
	Các loại directive chính:
		- Component directive
			+ directive quan trọng nhất vì nó định nghĩa component
			+ mỗi component thực chất là 1 directive riêng
			Ex: 
				@Component ({
					selector: "app-hello",
					template: "<h2>hi</h2>
				})
		- Structural directive 
			https://github.com/angular-vietnam/100-days-of-angular/blob/master/Day014-ng-template-ng-template-outlet-ng-container.md
			+ những directive này thêm, xóa, or thay đổi cấu trúc DOM
			+ luôn bắt đầu với dấu *
				*ngIf: điều kiện hiển thị phần tử
				*ngFor: lặp qua danh sách
				*ngSwitch: thay đổi hiển thị dựa trên điều kiện
			Ex:
				<p *ngIf="isLogin">Hello</p>
				<ul *ngFor="let user of users"><li>{{user}}</li></ul>

				<div [ngSwitch]="userRole">
					<p *ngSwithCase="'admin'">Admin</p>
					<p *ngSwithCase="'user'">User</p>
				</div>
		- Atrribute directive 	
			Thay đổi giao diện hoặc hành vi phần tử
			Thay đổi css, class, thuộc tính của phần tử
			Ex: 
				[ngClass]
				[ngStyle]
				directive tự tạo để thay đổi thuộc tính
					Ex: 
						@Directive({ selector: '[appHighlight]})
						export class HighLightDirective{
							@Input() highlightColor: string = 'yellow'
							constructor(private el: ElementRef) {}
							@HostListener('mouseenter') onMouseEnter() {
								this.el.nativeElement.style.backgroundColor = this.highlightColor;
							}
							@HostListener('mouseleave') onMouseLeave() {
								this.el.nativeElement.style.backgroundColor = 'transparent';
							}
						}
						Sử dụng:
							<p appHighlight highlightColor="blue">Đây là màu</p>

10. **Pipes trong Angular** là gì? Khi nào nên dùng pipes?  
	Pipe là 1 tính năng giúp biến đổi dữ liệu trước khi hiển thị trong template
	Tác dụng:
		Giúp định dạng dữ liệu nhanh chóng trong template
		Có thể dùng interpolation {{}} hoặc Binding []
		Dùng ký hiệu | (pipe operation) để áp dụng pipes
		Có thể kết hợp nhiều pipe or tạo custom pipe
	Một số pipe trong Angular:
		+ DatePipe: | date:'dd/MM/yyy'. Ex: new Date() => 19/2/2025
		+ CurrencyPipe: | currency:'VND'. Ex: 1000 => 1.000 đ
		+ PercentPipe: | percent. Ex: 0.05 => 5%
		+ UpperCasePipe/LowerCasePipe. Ex: | uppercase , | lowercase
		+ SlicePipe: | slice0:5. Ex: 'Hello ae' => 'Hello'
	Tự custom pipes
		Ex: 
			@Pipe({ name: 'reserve'})
			export class ReservePipe implements PipeTransform{
				transform(value: string): string {
					return value.split('').reserve().join('')
				}
			}
			Sử dụng: 
				<p>{{ 'Angular' | reserve }}</p>

---
## **2. Câu hỏi về Components và Templates**

11. Angular Component có những lifecycle nào?  
	Lifecycle của angular bao gồm từ giao đoạn component được khởi tạo đến khi bị hủy. Angular cung cấp các lifecycle hooks giúp can thiệp vào từng giai đoạn
	Các lifecycle hooks:
		+ ngOnChanges(): khi @Input() name!: string thay đổi từ component cha:
			Ex: 
				@Input() name!: string;
				ngOnChanges(changes: SimpleChanges) {
					console.log(change['name'].currentValue)
				}

		+ ngOnInit(): chỉ chạy 1 lần sau khi component khởi tạo, dùng để khởi tạo dữ liệu or gọi API
			Ex:
				ngOnInit() {
					console.log("Component đã khởi tạo")
				}

		+ ngDoCheck(): giúp kiểm tra sự thay đổi sâu bên trong obj or array. Dùng khi angular không phát hiện được sự thay đổi(do không thay đổi tham chiếu). Cần tối ưu để tránh ảnh hưởng hiệu suất

		+ ngAfterContentInit(): chạy 1 lần khi <ng-content> được đưa vào component  
		+ ngAfterContentChecked(): chạy mỗi lần change detection kiểm tra <ng-content>. Chạy sau ngAfterContentInit()
			Ex: 
				tooltip.component.ts
					@Component({
						selector: 'app-tooltip',
						template: `
							<div class="tooltip-container">
								<ng-content></ng-content>
							</div>
						`
					})
					export class TooltipComponent implements AfterContentInit, AfterContentChecked {
						@ContentChild('tooltipContent') tooltipContent!: ElementRef
						constructor(private render: Renderer2){}

						// chạy duy nhất 1 lần
						ngAfterContentInit():void {
							this.updateTooltipSize() 
						}

						// chạy mỗi khi change detected
						ngAfterContentChecked():void {
							this.updateTooltipSize()
						} 

						private updateTooltipSize():void{
							if(this.tooltipContent) {
								const text = this.tooltipContent.nativeElement.innerText
								const lenght = text.length
								this.renderer.setStyle(this.tooltipContent.nativeElement, 'width', `${length * 8}px`)
							}
						}
					}
				app.component.ts
					<app-tooltip> 
						<span #tooltipContent> {{tooltipText}} </span>
					</app-tooltip>

		+ ngAfterViewInit(): chạy sau khi View (template + DOM) được khởi tạo. Dùng để truy cập ViewChild or ViewContenerRef
		+ ngAfterViewChecked(): chạy sau mỗi lần change detection kiểm tra view
			Ex: 
				card.component.ts
					@Component({
						selector: 'app-card',
						template: `
							<div #cardContainer class="card">
								<p>{{content}}</p>
							</div>
						`
					})
					export class CardComponent implements AfterViewInit, AfterViewChecked{
						@ViewChild('cardContainer') cardElement!: ElementRef;
						content:string = 'Nội dung ban đầu'
						constructor(private renderer: Renderer2) {}

						ngAfterViewInit() {
							this.updateCardHeight()
						}

						ngAfterViewChecked() {
							this.updateCardHeight()
						}

						private updateCardHeight():void {
							const height = this.cardElement.nativeElement.scrollHeight;
							this.renderer.setStyle(this.cardElement.nativeElement, 'height', `${height}px`)
						}
						updateContent(newContent: string):void {
							this.content = newContent;
						}
					}
				app.component.ts
					<app-card #card ></app-card>
					@ViewChild('card') card!: CardComponent
					changeCardContent() {
						const random = Math.random()
						this.card.updateContent(random)
					}
			Chú ý: 
				#card là 1 template reference variable để tham chiếu đến CardComponent
				ViewChild('card') giúp lấy CardComponent trong ts để gọi các methods của nó
				Có thể dùng trực tiếp card trong html nhưng cần truy cập trong ts phải dùng ViewChild('card')
		
		+ ngOnDestroy(): khi component bị hủy. Dùng để dọn dẹp bộ nhớ, hủy Subcription(Observable, Event, Timer, Websocket, ...)

12. Sự khác nhau giữa `ngOnInit()` và `constructor()` trong Angular?  
	+ constructor: 
		constructor() được gọi trước ngOnInit()
		chạy ngay khi component được khởi tạo
		để khởi tạo DI(inject service vào component)
	+ ngOnInit()
		là 1 lifecycle của angular, chạy sau khi component được khởi tạo
		được dùng để khởi tạo dữ liệu, gọi api, xử lý logic sau khi component đã có input từ @Input()
		được gọi 1 lần duy nhất sau constructor()

13. `ngOnChanges()` hoạt động như thế nào?  
	là lifecycle hook trong angular
	được gọi mỗi khi @Input() thay đổi
	nhận vào 1 đối số là SimpleChanges, giúp theo dõi giá trị cũ và mới của @Input()

	
14. **Interpolation (`{{ }}`)** trong Angular dùng để làm gì?  
15. **Property Binding (`[property]`)** là gì? Khi nào cần dùng?  
16. **Event Binding (`(event)`)** hoạt động như thế nào?  
17. **Two-way Binding (`[(ngModel)]`)** là gì? Khi nào nên dùng?  
18. Sự khác nhau giữa `@Input()` và `@Output()` trong Angular?  
19. Làm thế nào để truyền dữ liệu từ component cha xuống component con?  
20. Khi nào nên dùng ViewChild và ViewChildren?  

---

## **3. Câu hỏi về Directives và Pipes**
21. **Structural Directives (`*ngIf`, `*ngFor`, `*ngSwitch`)** là gì?  
22. **Attribute Directives (`[ngClass]`, `[ngStyle]`)** là gì?  
23. Sự khác nhau giữa `*ngIf` và `hidden` trong Angular?  
24. Khi nào nên dùng `ng-container`, `ng-content`, `ng-template`?   
25. Khi nào cần tạo Custom Directive trong Angular?  
26. **Pipes trong Angular** dùng để làm gì?  
27. Cách tạo Custom Pipe trong Angular?  
28. Sự khác nhau giữa **pure pipes** và **impure pipes** là gì?  
29. AsyncPipe trong Angular hoạt động như thế nào?  

---

## **4. Câu hỏi về Routing trong Angular**
30. **Angular Router** là gì?  
31. Làm thế nào để định nghĩa routes trong Angular?  
32. Khi nào nên dùng `routerLink` và `href`?  
33. `RouterModule.forRoot()` khác gì với `RouterModule.forChild()`?  
34. Khi nào cần sử dụng **Lazy Loading** trong Angular?  
35. **Route Guard** trong Angular là gì? Khi nào cần dùng?  
36. Sự khác nhau giữa `CanActivate` và `CanDeactivate`?  
37. `ActivatedRoute` dùng để làm gì?  
38. Làm thế nào để lấy `queryParams` từ URL?  

---

## **5. Câu hỏi về Forms trong Angular**
39. **Reactive Forms** và **Template-driven Forms** khác nhau thế nào?  
40. Khi nào nên sử dụng **FormGroup** và **FormControl**?  
41. Khi nào cần dùng `Validators.required` và `Validators.minLength`?  
42. Cách xử lý form validation trong Angular?  
43. Sự khác nhau giữa `valueChanges` và `statusChanges` trong Forms?  
44. `FormArray` trong Angular là gì?  
45. Khi nào cần sử dụng Custom Validators trong Angular?  

---

## **6. Câu hỏi về Services và Dependency Injection (DI)**
46. **Angular Service** là gì? Khi nào cần dùng?  
47. **Dependency Injection (DI)** trong Angular hoạt động như thế nào?  
48. Khi nào nên dùng `providedIn: 'root'`?  
49. `useClass`, `useValue`, `useFactory` trong DI là gì?  
50. `HttpClientModule` trong Angular dùng để làm gì?  
51. Làm sao để gọi API từ Angular?  
52. `Observable` và `Promise` khác gì nhau trong Angular?  
53. Khi nào nên dùng `async/await`, khi nào nên dùng RxJS?  
54. `Interceptor` trong Angular dùng để làm gì?  

---

## **7. Câu hỏi về RxJS và State Management**
55. RxJS là gì? Tại sao Angular sử dụng RxJS?  
56. **Observable và Observer** trong Angular là gì?  
57. `of()`, `from()`, `map()`, `filter()` trong RxJS hoạt động như thế nào?  
58. `switchMap()`, `mergeMap()`, `concatMap()` khác nhau như thế nào?  
59. **BehaviorSubject, Subject, ReplaySubject** khác gì nhau?  
60. Khi nào nên dùng `takeUntil()` trong Angular?  
61. Khi nào nên sử dụng state management như **NgRx, Akita, hoặc Redux**?  
62. `Store` trong NgRx hoạt động như thế nào?  

---

## **8. Câu hỏi về Performance Optimization**
63. Khi nào Angular bị re-render lại một component?  
64. Khi nào nên dùng **OnPush Change Detection**?  
65. `trackBy` trong `*ngFor` dùng để làm gì?  
66. Khi nào nên sử dụng `async pipe`?  
67. Tại sao không nên gọi API trực tiếp trong `ngOnInit()` mà nên dùng Service?  
 