# Anime library

`/anime` now browses the live KKPhim/PhimAPI catalog (Japanese animation), rather than the manually imported AniList store. The optional old admin importer and its database tables are retained; they are not required for the live viewer.

## Flow

- `GET /api/Anime/Library?keyword=&page=1`: 24 movies per page; an empty keyword loads recently updated anime.
- `GET /api/Anime/Library/{slug}`: movie information plus actual servers and episodes. Includes special labels such as Full/OVA, without guessing episode counts or exposing playback links here.
- `GET /api/Anime/Library/{slug}/playback?server=0&episode=tap-01`: resolve a provider episode to an HTTPS HLS URL and, when available, an allowlisted fallback embed.

All three endpoints require the existing `anime.view` policy. Only grant the Anime Viewer role / permission to intended accounts. Hiding the menu is not the access control. Existing Admin behavior is unchanged.

The backend uses the fixed `https://phimapi.com` API host, validates movie slugs, filters non-anime entries, caches successful provider responses for three minutes and times out upstream calls after 15 seconds. It neither downloads videos nor imports the whole catalog into PostgreSQL. No database migration or API key is needed for this change.

The frontend preserves the blog's current typography, colors, cards and responsive layout. Search/page parameters are kept in the URL for Back navigation. HLS.js loads on demand on browsers without native HLS; changing episode/server or leaving the page destroys the old player. Playback attempts autoplay with sound, subject to browser policy. A fallback iframe is permitted only on `player.phimapi.com`, with sandbox restrictions and no top navigation/popups.

## Limitations

The provider determines movie availability, titles, subtitles, stream accessibility, CORS and uptime. Its public API is not a guarantee of distribution rights; verify permission for content you use. The blog gate restricts access to our module/API, not the provider's independently public stream URLs. This implementation does not bypass paywalls, DRM or upstream restrictions.

After deploying **both Client and API**, test with a permitted account: catalog → search → detail → server → episode, and confirm an unpermitted account receives 401/403 for each library endpoint.

References: [provider API documentation](https://kkphim2.com/api-document), [HLS.js](https://github.com/video-dev/hls.js).
