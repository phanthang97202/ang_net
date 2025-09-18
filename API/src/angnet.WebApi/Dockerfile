# ==============================NEW STRUCTURE======================================
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore (to leverage Docker cache)
COPY API/src/angnet.WebApi/angnet.WebApi.csproj API/src/angnet.WebApi/
WORKDIR /src/API/src/angnet.WebApi
RUN dotnet restore "angnet.WebApi.csproj"

# Copy toàn bộ solution
WORKDIR /src
COPY . .

# Build & Publish
WORKDIR /src/API/src/angnet.WebApi
RUN dotnet publish "angnet.WebApi.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 80

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "angnet.WebApi.dll"]

