# Reels and archive media sources

Both modules accept direct HTTP(S) image/video URLs without uploading copies to Cloudinary. Archive still supports existing social/web links. External media can disappear or reject hotlinking; use public direct-file HTTPS URLs. No external file is fetched by the backend or deleted when the item is removed.

The permission catalogue migration `0045_QuyenUploadReelsVaArchive.sql` adds:

- `reel.upload_image`: device image uploads in Reels.
- `reel.upload_video`: device video uploads in Reels.
- `archive.upload`: device image/video uploads in the archive, in addition to `archive.use`.

Admin bypasses these checks as usual. Other users get no device-upload rights automatically; grant them through existing roles/permissions. Users must sign in again to receive updated permission claims. Link posting keeps existing authentication/module-access rules.

Reels now requests server-signed uploads; image/video signature endpoints enforce separate policies. Archive signature and stored-file creation enforce `archive.upload`; external items have no StoragePublicId so deletion never calls Cloudinary for them. New archive items default TakenAt to today's local calendar date; edits preserve the stored date, including an empty date.

Deployment: migrate API and deploy Client together. Cloudinary must have the existing `reels_image` and `reels_video` presets. **Change these presets to Signed** after deploying to prevent older unsigned clients or direct requests from bypassing app permissions; keep their format/size limits (10 MB images, 50 MB videos). Other unsigned presets such as the existing generic image-upload preset remain usable outside these modules; if full-account quota protection is required, migrate those callers before disabling their unsigned presets too. This change does not mutate Cloudinary configuration automatically.
