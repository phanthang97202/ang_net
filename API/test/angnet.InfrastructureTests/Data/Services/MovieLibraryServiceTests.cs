using System.Net;
using angnet.Infrastructure.Data.Services;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class MovieLibraryServiceTests
{
    private const string DetailJson = """
        {"status":true,"movie":{"slug":"test-movie","name":"Movie","type":"hoathinh",
        "country":[{"slug":"nhat-ban"}],"poster_url":"https://images.example/poster.webp",
        "content":"<p>Hello &amp; world</p>","year":2026},"episodes":[
        {"server_name":"Vietsub","server_data":[
        {"slug":"full","name":"Full","link_m3u8":"https://cdn.example/index.m3u8",
        "link_embed":"https://player.phimapi.com/player/?url=https://cdn.example/index.m3u8"},
        {"slug":"ova","name":"OVA","link_m3u8":"","link_embed":"https://evil.example/player/"}]},
        {"server_name":"Dub","server_data":[{"slug":"full","name":"Full dub","link_m3u8":"https://cdn.example/dub.m3u8"}]}]}
        """;

    [TestMethod]
    public async Task Browse_SearchesAllMoviesWithPaginationAndAbsoluteImages()
    {
        const string json = """
            {"status":"success","data":{"APP_DOMAIN_CDN_IMAGE":"https://phimimg.com",
            "params":{"pagination":{"currentPage":2,"totalPages":3,"totalItems":60}},"items":[
            {"name":"Movie","slug":"test","type":"hoathinh","country":[{"slug":"nhat-ban"}],"poster_url":"uploads/poster.webp"},
            {"name":"Live action","slug":"other","type":"single","country":[{"slug":"au-my"}]}]}}
            """;
        using var handler = new ProviderHandler(json);
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = Create(handler, cache);
        var result = await service.Browse("one & two", 2, default);
        Assert.AreEqual(2, result.Items.Count);
        Assert.AreEqual("https://phimimg.com/uploads/poster.webp", result.Items[0].PosterUrl);
        Assert.AreEqual(2, result.Page);
        Assert.AreEqual(60, result.TotalItems);
        Assert.AreEqual("phimapi.com", handler.LastUri!.Host);
        StringAssert.Contains(handler.LastUri.Query, "keyword=one%20%26%20two");
        StringAssert.Contains(handler.LastUri.Query, "page=2&limit=24");
        Assert.IsFalse(handler.LastUri.Query.Contains("category="));
        Assert.IsFalse(handler.LastUri.Query.Contains("country="));
    }

    [TestMethod]
    public async Task DetailAndPlayback_SupportSpecialEpisodesServersAndCache()
    {
        using var handler = new ProviderHandler(DetailJson);
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = Create(handler, cache);
        var detail = await service.Detail("test-movie", default);
        Assert.AreEqual(2, detail.Servers.Count);
        Assert.AreEqual("Full", detail.Servers[0].Episodes[0].Name);
        Assert.IsFalse(detail.Servers[0].Episodes[1].HasSource);
        StringAssert.Contains(detail.Description, "Hello & world");
        var playback = await service.Playback("test-movie", 1, "full", default);
        Assert.AreEqual("https://cdn.example/dub.m3u8", playback.Url);
        Assert.AreEqual(1, handler.Calls);
        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() => service.Playback("test-movie", 2, "full", default));
        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() => service.Playback("test-movie", 0, "missing", default));
        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() => service.Playback("test-movie", 0, "ova", default));
    }

    [TestMethod]
    public async Task InvalidSlugAndPagination_DoNotMakeOutboundRequests()
    {
        using var handler = new ProviderHandler(DetailJson);
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = Create(handler, cache);
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Detail("https://internal.local/secret", default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Detail("../secret", default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Browse("", 0, default));
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => service.Browse(new string('a', 101), 1, default));
        Assert.AreEqual(0, handler.Calls);
    }

    [TestMethod]
    public async Task Detail_AcceptsLiveActionMoviesFromAnyCountry()
    {
        using var handler = new ProviderHandler(DetailJson.Replace("hoathinh", "single").Replace("nhat-ban", "au-my"));
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var movie = await Create(handler, cache).Detail("test-movie", default);
        Assert.AreEqual(2, movie.Servers.Count);
        Assert.IsTrue(movie.Servers[0].Episodes[0].HasSource);
    }

    private static MovieLibraryService Create(ProviderHandler handler, IMemoryCache cache)
    {
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(handler, false));
        return new MovieLibraryService(factory.Object, cache);
    }

    private sealed class ProviderHandler(string json) : HttpMessageHandler
    {
        public int Calls { get; private set; }
        public Uri? LastUri { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            LastUri = request.RequestUri;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(json) });
        }
    }
}
