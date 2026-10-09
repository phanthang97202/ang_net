# Chat permissions and unread notifications

The existing chat is one shared room. This change does not introduce private conversations. An eligible account connects while the chat panel is closed, so incoming messages can display a count badge and the newest sender/message beside the launcher. The preview uses the blog's dark rounded label style, stays within narrow screens, escapes text and displays an image-message label rather than its URL. The badge caps its display at `99+`; the underlying count is exact.

## Permissions

- `chat.view`: history, unread summary, own read acknowledgement and SignalR connection/receiving.
- `chat.send`: sending text/images through SignalR; also requires `chat.view`.
- Admin retains the existing permission bypass. A viewer has no composer/upload action. Missing view hides the entire widget.

Both permissions are checked on the backend. Hub send rechecks the current account/session on an already-established connection. Sender identity comes from the verified JWT, preserving old email-based history and using `account:{Id}` for email-less accounts. Send rejects empty/overlong text, unsupported types and non-HTTPS image URLs. Broadcasting targets only registered sockets whose JWT is unexpired, account is active and session version/current view permission are valid. Revoked/locked sockets cannot send or receive later messages. Query-string access tokens are accepted only under `/chat-hub`; the socket closes on authentication expiration.

## Unread state

`Chat.Sequence` is a database-generated ordered cursor. `ChatReadState` stores one monotonic cursor per account; it is shared across devices and survives reloads. Counts include other senders' messages after that cursor. First use initializes at the current archive, preventing historical messages from appearing as new notifications. PostgreSQL sends serialize inserts inside a transaction before allocating a cursor so a later message cannot commit first and hide an earlier unread message.

The panel acknowledges the newest displayed cursor only when the tab is visible, history has loaded and the reader is at the bottom. Scrolling through older messages does not clear unread messages or forcibly scroll the reader down. New events/history are merged by the persisted message ID. Closing/reopening removes component listeners without disconnecting the launcher. Acknowledgement never moves backwards and cannot target another account. SignalR reconnect reloads recent history; a 15-second summary sync recovers unread state after lost events and synchronizes read acknowledgements from other devices. Unread state is cleared in memory when the widget stops, avoiding stale private previews after logout.

## Sender profiles and chat images

History, notifications and persisted realtime messages include `SenderName` and `SenderAvatar` read from the current account in the database. Profiles are fetched once per page rather than once per message. Both legacy email identities and `account:{Id}` identities are supported. The UI uses a name/initial placeholder when an account or avatar is unavailable, without displaying email as the author label. These fields are not mapped to database columns, so this update needs no additional migration.

Chat image uploads now use `POST /api/chat/image`, requiring both `chat.view` and `chat.send`. The client and server reject empty files and files at or above 2,097,152 bytes (2 MiB); JPG, PNG, GIF and WebP are supported. The server validates the request before forwarding to Cloudinary's signed image upload endpoint, with allowed formats included in the signature. It uses the existing server `Cloudinary:CloudName`, `Cloudinary:ApiKey`, `Cloudinary:ApiSecret` configuration or `CLOUDINARY_URL`. Chat no longer uses the generic unsigned client upload preset. Other modules retain their existing upload limits. Deploy the API and Client together.

Chat UI/profile/upload follow-up verification on 2026-10-09: 11 focused frontend tests and 8 backend chat tests passed, and both production Client and API builds passed. Tests cover sender profiles from the database in the writer/history/notifications, keeping the profile payload in realtime broadcasts, strict upload boundary checks before Cloudinary, and view/send permissions. Cloudinary is mocked in API tests; no real file was uploaded. Desktop and 390px mobile DOM/layout checks confirmed the avatar loads, the panel uses the blog font and 24px radius, and the composer fits without horizontal overflow.

## Deployment and verification

Deploy API and Client together. Startup migration `0040_PhanQuyenVaThongBaoChat.sql` seeds the two permission keys, adds/backfills an ordered message sequence without changing message IDs/content and creates the read-state table. It does not grant permissions to any existing role. Assign the appropriate permissions through role management; sign in again or revoke old sessions to update JWT claims.

Tests use local HTTP, real WebSocket JSON protocol and an isolated SQLite database, with a mock writer for hub permission/delivery assertions. They cover HTTP/hub access denial, view-only sending denial, trusted sender identity, stale-session socket rejection, payload validation, persisted monotonic read cursors, excluding own messages and first-use behavior. Angular tests render the real widget/panel and cover counts, safe previews, image labels, viewer/sender UI, cleanup, visible/bottom-only acknowledgement and HTTPS uploads. UI inspection uses an isolated Angular preview with sample data at desktop and 390px mobile; it does not access real accounts or send messages. PostgreSQL migration/locking/generated cursors and a deployed account flow still require a deployment smoke test. No real DB migration, permission grant or message operation was performed locally.

Local results on 2026-10-09: 25 selected backend tests and all 69 frontend tests passed; API and Client production builds passed. Browser DOM/layout checks confirmed the mobile panel stays within 390px, the preview uses a dark background/white text/8px radius, the icon renders, read-only mode hides the composer and reading clears the badge. Screenshot capture was unavailable, so browser checks use accessibility/DOM state and computed layout/style. Notification requests are cancelled on account changes, and stale responses cannot overwrite the current account's preview.
