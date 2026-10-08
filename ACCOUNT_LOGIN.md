# Admin-provisioned username/password accounts

Google login and first-time Google signup remain enabled. Public `register` and `getregistercode` endpoints return 403; the login page no longer links to self-registration. Existing email/password clients remain compatible: the legacy `Email` login field accepts either an email or a local username. Local usernames are case-insensitive and cannot contain `@`.

Only the Admin role can call `api/Account/admin/users` endpoints or see credential actions in the user list:

- GET `by-email?email=...`: find an existing account without exposing password hashes.
- POST: create a new active account with full name, username and password; email is optional. Assign only the existing User role.
- PUT `{userId}/credentials`: add a username and password to an existing passwordless account. Keep its UserId, email, profile, roles and all owned data. Never overwrite an existing password.
- POST `{userId}/reset-password`: explicitly replace an existing password, clear password lockout, revoke refresh tokens and invalidate outstanding emailed reset codes. Already-issued access JWTs stay valid until their normal expiry.

The create form checks email only when supplied. An omitted, empty or whitespace email is stored as NULL, allowing multiple email-less accounts. Identity's standard username validation remains enabled; OptionalEmailUserValidator validates and rejects duplicate supplied emails. For an existing passwordless account the form switches to an explicit confirmation step; an existing account with a password cannot be overwritten through Create. Username collisions are rejected. New passwords use Identity hashing/validation (minimum 8 characters, upper/lowercase, digit and special character). Credential writes, role assignment and audit commit in one database transaction. Passwords/confirmation values are not returned or recorded in audit/logs; existing historical logs are not deleted by this change. Email-less users sign in with username and contact the admin for password resets; Google login is unchanged.

No new user table is required. Migration `0037_DamBaoEmailTaiKhoanKhongTrung.sql` makes the existing NormalizedEmail index unique to protect concurrent Google/admin account creation. It deliberately fails instead of merging/deleting users if historical normalized emails are duplicated. Deploy API and Client together; normal API startup applies the script.

Targeted verification covers Admin-only access, disabled public registration, duplicate email/username, password overwrite protection, safe account lookup, username/email login resolution, password-free audit/log output and the unique email model. Real database transactions, external Google sign-in and responsive browser interaction still need deployment smoke testing.
