# Movie library

`/phim` browses the live KKPhim/PhimAPI catalog across movie types, countries and genres. Search is no longer restricted to Japanese animation. The search-only layout and the blog's Montserrat typography, colors and responsive cards are preserved.

## Flow

- `GET /api/Movie/Library?keyword=&page=1`: 24 movies per page; an empty keyword loads recently updated films from the provider's `/v1/api/danh-sach`.
- `GET /api/Movie/Library/{slug}`: movie information plus actual servers and episodes, including labels such as Full/OVA. Does not expose playback links.
- `GET /api/Movie/Library/{slug}/playback?server=0&episode=tap-01`: resolves a provider episode to an HTTPS HLS URL and, when available, an allowlisted fallback embed.

All endpoints require `movie.view`. Migration `0035_DoiModuleAnimeThanhPhim.sql` renames the existing viewer permission and role claims, preserving role IDs and user assignments. Existing JWTs carrying `anime.view` remain accepted for this permission until expiry. Admin bypass behavior is unchanged.

The migration changes the default menu path/title to `/phim` / Phim (Movies), preserving custom labels, menu visibility and ordering. Old `/anime` and `/anime/:slug` links redirect to the new viewer. The old `/api/Anime/Library` route is a compatibility alias with the same authorization policy.

## Retired manual management

The admin anime-manager screen, its dashboard route/menu, AniList importer, manual-source APIs and their client bindings have been removed. The obsolete `anime.manage` permission is inactive. No Anime, AnimeEpisode or AnimeSource tables or data are deleted; those historical migrations/models are retained to avoid destroying existing records.

## Provider and playback

The backend uses the fixed `https://phimapi.com` host, validates movie slugs, caches successful responses for three minutes and times out calls after 15 seconds. No video download, full-catalog import or provider API key is required.

The provider's embed player is selected by default whenever a valid embed exists. Only `player.phimapi.com` is allowed for these iframes, with sandbox restrictions. HLS remains an alternative, and is selected automatically when no valid embed is available. The player-selector toolbar appears only when both sources exist.

HLS.js loads on demand on browsers without native HLS. Switching player, episode/server or leaving the page destroys the old player. HLS autoplay attempts keep sound enabled, subject to browser policy; embed playback behavior is controlled by the provider.

On an unrecoverable HLS error, the viewer automatically switches to a valid provider embed once per episode/server selection and shows a short status message. Duplicate errors, errors from destroyed HLS loads and autoplay-policy rejections do not cause switches. Manual player selection remains available. Reverse automatic fallback is not supported: the cross-origin provider iframe does not expose a documented playback-error event to the host page, so iframe load events or arbitrary timeouts are not treated as playback failure.

Provider availability, subtitles, stream access, CORS and uptime remain outside our control. A public API does not guarantee distribution rights; verify permission for content used. The blog gate protects our module/API, not independently public upstream stream links. This code does not bypass DRM, paywalls or upstream restrictions.

Deploy **both Client and API**. The API's normal database migrator applies script 0035 on startup. Test permitted and unpermitted accounts against all three endpoints, including an old session token and a freshly issued token.

References: [provider API documentation](https://www.kkphim2.com/api-document), [HLS.js](https://github.com/video-dev/hls.js).
