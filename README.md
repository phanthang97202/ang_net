## 🧩 angnet – Modular .ASP NET CORE 8 - Angular v17 - .NET MAUI 

## If you want to develop this project, don't hasitate to contact me ^^.

## 📚 Introduction
    **angnet** is a football management project.

## ⚙️ Tech stack
    - ✅ [.NET 8 Web API](https://learn.microsoft.com/en-us/aspnet/core)
    - ✅ [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
    - ✅ SQL Server
    - ✅ Unit Test & Integration Test với MSTest và Moq
    - ✅ JWT
    - ✅ Angular v17
    - ✅ .NET MAUI  

## 🏗️ Architecture project
    ang_net/
        ├── Client/                            
        ├── Mobile/                            
        ├── API/                            
            ├── src/                            
                ├── angnet.Domain/                 # Entities, Enums, ValueObjects
                ├── angnet.Application/            # Interfaces, Dtos, Business logic
                ├── angnet.Infrastructure/         # Services, DbContext, UnitOfWork
                └── angnet.Utility/                # Common utilities  
                └── angnet.WebApi/                 # Main 
            ├── test/                            
                ├── angnet.InfrastructureTests/    # Services, DbContext, UnitOfWork
            ├── ang_net.sln                        # solution

## ⚙️ Setup running
    CLONE SOURCE TO LOCAL
        git clone https://github.com/phanthang97202/ang_net.git

    RUN BACKEND
        cd ang_net/API => 
            Option 1: dotnet run 
            Option 2: open in Visual Studio => Set angnet.WebApi to start project => run with IIS
    
    RUN FRONTEND
        cd ang_net/Client => 
            ng serve 
    
    RUN MOBILE
        cd ang_net/Mobile => 
            Option 1: dotnet run 
            Option 2: open in Visual Studio => run with Window Virtual Machine

## 🧑 Author
    Full name: Phan Thang
    Email: phanthang97202@gmail.com
    GitHub: https://github.com/phanthang97202

