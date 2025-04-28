# Use the official .NET SDK 8.0 image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set working directory
WORKDIR /src

# Copy everything at once (solution + all projects)
COPY . .

# Restore dependencies
RUN dotnet restore "FullstackAppTutorial.generated.sln"

# Build the application
WORKDIR /src/API
RUN dotnet build "API.csproj" -c Release -o /app/build

# Publish the application
RUN dotnet publish "API.csproj" -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 80

# Copy published output
COPY --from=build /app/publish .

# Run the app
ENTRYPOINT ["dotnet", "API.dll"]
