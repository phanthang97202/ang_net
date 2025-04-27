# Use the official .NET SDK 8.0 image for building the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set the working directory inside the container to /src
WORKDIR /src

# Copy the .csproj file and restore the dependencies
COPY API.csproj ./
RUN dotnet restore "./API.csproj"

# Copy the rest of your application files
COPY . .

# Build the application in Release mode and output to /app/build
WORKDIR "/src"
RUN dotnet build "API.csproj" -c Release -o /app/build

# Publish the application to the /app/publish directory
RUN dotnet publish "API.csproj" -c Release -o /app/publish

# Use the official .NET ASP.NET Core runtime image for the final image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

# Copy the published files from the build stage
COPY --from=build /app/publish .

# Set the entry point for the application to run the API
ENTRYPOINT ["dotnet", "API.dll"]
