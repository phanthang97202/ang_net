using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Linq;
using API.Application.Interfaces.Repositories;
using DocumentFormat.OpenXml.Vml;
using System;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml.InkML;

namespace API.Infrastructure.Data.Repositories
{
    public class BaseRepository<TEntity> : IBaseRespository<TEntity> where TEntity : class
    {
        protected readonly DbContext _dbCtx;
        protected readonly DbSet<TEntity> _dbSet;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public BaseRepository(DbContext dbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbCtx = dbContext;
            _dbSet = _dbCtx.Set<TEntity>();
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<TEntity> Create(
                TEntity entity
            )
        {
            await _dbSet.AddAsync(entity);
            return entity;
        }

        public Task Update(
                TEntity entity
                , params Expression<Func<TEntity, object>>[] updatedProperties
            )
        {
            _dbCtx.Attach(entity);
            foreach (var property in updatedProperties)
            {
                _dbCtx.Entry(entity).Property(property).IsModified = true;
            }
            return Task.CompletedTask;
        }

        /// <summary>
        /// Lấy entity theo primary key kết hợp thêm điều kiện tùy chọn
        /// </summary>
        /// <param name="id">Giá trị primary key cần tìm</param>
        /// <param name="additionalPredicate">Điều kiện bổ sung (optional)</param>
        /// <param name="cancellationToken">Token hủy tác vụ (optional)</param>
        /// <returns>Entity thỏa mãn điều kiện hoặc null nếu không tìm thấy</returns>
        /// <exception cref="InvalidOperationException">Khi entity không có primary key</exception>
        
        /// // 1. Tìm theo primary key đơn giản
        //var product = await repo.GetByCode(1);
        //// 2. Tìm kết hợp điều kiện bổ sung
        //var activeUser = await repo.GetByCode(
        //    "user123",
        //    u => u.IsActive && u.Role == "Admin");
        //// 3. Với khả năng hủy tác vụ
        //using var cts = new CancellationTokenSource();
        //    var result = await repo.GetByCode(5, cancellationToken: cts.Token);

        //Khi Nào Nên Dùng CancellationToken
        //    Tình huống Ví dụ
        //    API calls HTTP request, database query
        //    Long-running tasks  Xử lý file lớn, batch processing
        //    User cancellation   Người dùng nhấn "Hủy" trên UI
        //    Timeout Giới hạn thời gian thực thi
        public async Task<TEntity> GetByCode(
            object id,
            Expression<Func<TEntity, bool>> additionalPredicate = null)
        {
            // 1. Lấy thông tin primary key từ metadata của entity
            var keyProperty = _dbCtx.Model.FindEntityType(typeof(TEntity))?
                .FindPrimaryKey()?.Properties.FirstOrDefault();

            if (keyProperty == null)
            {
                throw new InvalidOperationException(
                    $"Entity {typeof(TEntity).Name} does not have a defined primary key.");
            }

            // 2. Tạo parameter expression (x => ...)
            var parameter = Expression.Parameter(typeof(TEntity), "x");

            // 3. Xây dựng biểu thức so sánh primary key (x.Id == id)
            var idEquality = Expression.Equal(
                Expression.Property(parameter, keyProperty.Name),
                Expression.Convert(Expression.Constant(id), keyProperty.ClrType) // Xử lý kiểu dữ liệu
            );

            // 4. Kết hợp với điều kiện bổ sung nếu có
            Expression finalExpression = idEquality;
            if (additionalPredicate != null)
            {
                // Thêm điều kiện dạng: x.Id == id && additionalPredicate(x)
                finalExpression = Expression.AndAlso(
                    idEquality,
                    Expression.Invoke(additionalPredicate, parameter)
                );
            }

            // 5. Biên dịch thành biểu thức Lambda hoàn chỉnh
            var lambda = Expression.Lambda<Func<TEntity, bool>>(finalExpression, parameter);

            // 6. Thực thi truy vấn với các tối ưu:
            // - AsNoTracking: Không theo dõi thay đổi (tăng hiệu năng cho read-only)
            // - FirstOrDefaultAsync: Trả về null nếu không tìm thấy
            // - cancellationToken: Hỗ trợ hủy tác vụ
            // Lấy cancellationToken từ HttpContext
            var _cancellationToken = _httpContextAccessor.HttpContext.RequestAborted; // Kiểm tra CancellationToken_httpContextAccessor

            return await _dbSet
                .AsNoTracking()
                .FirstOrDefaultAsync(lambda, _cancellationToken);
        } 

        public async Task<(bool exists, T data)> CheckRecordExist<T>(
            Expression<Func<T, bool>> predicates 
            )
            where T : class
        {
            // Khởi tạo query
            var query = _dbCtx.Set<T>().AsQueryable();

            // Áp dụng tất cả điều kiện predicates
            query = query.Where(predicates);

            // Lấy cancellationToken từ HttpContext
            var _cancellationToken = _httpContextAccessor.HttpContext.RequestAborted; // Kiểm tra CancellationToken_httpContextAccessor

            // Thực thi truy vấn bất đồng bộ
            var record = await query.AsNoTracking().FirstOrDefaultAsync(_cancellationToken);

            // Trả về tuple (exists, data) 
            return (record is not null, record);
        }

        //Func<int, int, int> add = (a, b) => a + b;
        //int result = add(3, 5); // result = 8
        // Lọc danh sách trong bộ nhớ
        //List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
        //Func<int, bool> filter = x => x > 3;
        //var filtered = numbers.Where(filter).ToList(); // [4, 5]

        //Expression<Func<int, int, int>> addExpr = (a, b) => a + b;
        //// Lọc dữ liệu từ database
        //Expression<Func<Product, bool>> expr = p => p.Price > 100;
        //var expensiveProducts = dbContext.Products
        //                               .Where(expr) // Dịch thành SQL
        //                               .ToList();
        //Dùng Func khi:
        //Làm việc với collections trong bộ nhớ
        //Cần hiệu năng cao
        //Không cần phân tích logic bên trong
        //Dùng Expression khi:
        //Làm việc với ORM như Entity Framework
        //Cần xây dựng truy vấn động
        //Muốn dịch logic sang ngôn ngữ khác(SQL)

        //Lambda expression là một cách viết ngắn gọn để tạo các hàm ẩn danh(anonymous functions) trong C#.
        //Nó cho phép bạn viết hàm mà không cần đặt tên, thường dùng để truyền logic như một tham số.
        // Expression → Func
        //Expression<Func<int, int>> squareExpr = x => x * x;
        //Func<int, int> squareFunc = squareExpr.Compile();
        //int result = squareFunc(5); // 25
        //// Func → Expression: KHÔNG THỂ làm trực tiếp
        ///

        //// Định nghĩa delegate
        //delegate void ProcessDataCallback(int result);

        //// Hàm nhận delegate làm tham số
        //void ProcessComplexData(ProcessDataCallback callback)
        //{
        //    // Xử lý phức tạp...
        //    int finalResult = 100;
        //    callback(finalResult); // Gọi lại (callback)
        //}

        //// Sử dụng
        //ProcessComplexData(result => Console.WriteLine($"Kết quả: {result}"));

        public virtual async Task<List<TResult>> GetAll<TResult>(
            Expression<Func<TEntity, bool>> predicate = null,
            Expression<Func<TEntity, TResult>> selector = null
        )
        {
            // Lấy cancellationToken từ HttpContext
            var _cancellationToken = _httpContextAccessor.HttpContext.RequestAborted; // Kiểm tra CancellationToken_httpContextAccessor

            IQueryable<TEntity> query = _dbSet.AsNoTracking();
            if (predicate != null)
                query = query.Where(predicate);

            if (selector != null)
                return await query.Select(selector).ToListAsync(_cancellationToken);

            // If no selector is provided, return the entities directly
            return await query.Cast<TResult>().ToListAsync(_cancellationToken);
        }

        public Task Delete(
            object id
            )
        {
            _dbCtx.Remove(id);
            return Task.CompletedTask;
        }

    }
}


//# Bản Chất và Công Dụng Của Delegate trong C#

//Delegate là một trong những khái niệm nền tảng nhất trong C#, đóng vai trò cực kỳ quan trọng trong kiến trúc ngôn ngữ này. Dưới đây là phân tích gốc rễ về lý do delegate tồn tại và những bài toán nó giải quyết:

//## 1. Định Nghĩa Cốt Lõi
//**Delegate là "con trỏ hàm thông minh"** - một đối tượng đặc biệt có thể tham chiếu đến phương thức, cho phép truyền phương thức như tham số.

//## 2. Những Bài Toán Lớn Delegate Giải Quyết

//### a. Truyền Logic Như Tham Số (Callback Pattern)
//```csharp
//// Định nghĩa delegate
//delegate void ProcessDataCallback(int result);

//// Hàm nhận delegate làm tham số
//void ProcessComplexData(ProcessDataCallback callback)
//{
//    // Xử lý phức tạp...
//    int finalResult = 100;
//    callback(finalResult); // Gọi lại (callback)
//}

//// Sử dụng
//ProcessComplexData(result => Console.WriteLine($"Kết quả: {result}"));
//```

//### b. Implement Event-Driven Architecture
//```csharp
//class Button
//{
//    public delegate void ClickHandler();
//    public event ClickHandler OnClick;

//    public void Press()
//    {
//        OnClick?.Invoke(); // Kích hoạt sự kiện
//    }
//}

//// Đăng ký sự kiện
//button.OnClick += () => Console.WriteLine("Button clicked!");
//```

//### c. Cho Phép Late Binding
//```csharp
//delegate int MathOperation(int a, int b);

//MathOperation op;
//if (DateTime.Now.Hour < 12)
//    op = (a, b) => a + b; // Sáng: cộng
//else
//    op = (a, b) => a - b; // Chiều: trừ

//int result = op(5, 3); // Phụ thuộc vào thời gian thực
//```

//### d. Hỗ Trợ LINQ và Functional Programming
//```csharp
//var numbers = new List<int> { 1, 2, 3 };
//var squares = numbers.Select(x => x * x); // Lambda expression thực chất là delegate
//```

//## 3. Phân Tích Kiến Trúc Sâu

//### a. Observer Pattern Implementation
//```csharp
//// Publisher
//class NewsPublisher
//{
//    public delegate void NewsHandler(string news);
//    public event NewsHandler NewsPublished;

//    public void Publish(string news)
//    {
//        NewsPublished?.Invoke(news);
//    }
//}

//// Subscriber
//var publisher = new NewsPublisher();
//publisher.NewsPublished += news => Console.WriteLine($"Nhận tin: {news}");
//```

//### b. Strategy Pattern Implementation
//```csharp
//delegate void ISortStrategy(List<int> data);

//void BubbleSort(List<int> data) { ... }
//void QuickSort(List<int> data) { ... }

//class Sorter
//{
//    private ISortStrategy _strategy;

//    public void SetStrategy(ISortStrategy strategy)
//    {
//        _strategy = strategy;
//    }

//    public void Sort(List<int> data)
//    {
//        _strategy(data);
//    }
//}
//```

//## 4. Ưu Điểm Vượt Trội So Với Cách Tiếp Cận Khác

//| Scenario | Không dùng Delegate       | Dùng Delegate               |
//|------------------------|--------------------------|----------------------------|
//| Callback               | Interface phức tạp        | Truyền trực tiếp phương thức |
//| Event Handling         | Phải kế thừa lớp base     | Đăng ký sự kiện linh hoạt    |
//| Thay đổi thuật toán    | Phải viết lại lớp         | Thay delegate runtime       |

//## 5. Cách .NET Triển Khai Delegate Ở Mức Thấp

//- **Bản chất**: Là class đặc biệt kế thừa `System.MulticastDelegate`
//- **Chứa 3 thành phần chính**:
//  1. `_target`: Tham chiếu đến object chứa phương thức (nếu là instance method)
//  2. `_methodPtr`: Con trỏ đến phương thức
//  3. `_invocationList`: Danh sách các delegate (cho multicast)

//- **Quá trình gọi**: Khi invoke, runtime sẽ duyệt qua `_invocationList` và gọi tuần tự

//## 6. Các Loại Delegate Quan Trọng

//| Loại                  | Mục Đích                  | Ví Dụ                       |
//|-----------------------|--------------------------|----------------------------|
//| Singlecast            | Gọi 1 phương thức         | `Action`, `Func`            |
//| Multicast             | Gọi nhiều phương thức     | Sự kiện (`event`)           |
//| Covariant             | Hỗ trợ kế thừa kiểu trả về | `Func<Animal>` cho `Func<Dog>`|
//| Contravariant         | Hỗ trợ kế thừa tham số    | `Action<Dog>` cho `Action<Animal>`|

//## 7. Tại Sao Không Thay Thế Bằng Interface?

//Delegate vượt trội hơn interface khi :
//- **Performance**: Gọi nhanh hơn qua delegate (ít overhead)
//- **Flexibility * *: Không cần implement nhiều interface
//-**Closure * *: Hỗ trợ capture biến ngoài phạm vi
//- **Conciseness**: Lambda expression ngắn gọn hơn

//Delegate chính là nền tảng cho:
//-Toàn bộ hệ thống sự kiện trong .NET
//- Cơ chế LINQ
//- Các mẫu thiết kế hiện đại (Observer, Strategy, Command)
//- Async/await pattern (Task-based asynchronous pattern)

//Hiểu sâu delegate giúp bạn nắm được "linh hồn" của C# và .NET!