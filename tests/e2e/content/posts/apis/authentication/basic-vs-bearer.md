---
title: 'Basic vs bearer authentication'
summary: 'Two Authorization header schemes that look similar and behave very differently.'
date: 2026-09-10
order: 2
tags: [http, security]
---

<!-- seed content: replace before publishing -->

Both schemes travel in the same `Authorization` header, which is why they get confused. They differ in what the value means and in what the server has to do with it.

## Basic

Basic sends a username and password on every request, joined with a colon and Base64-encoded. Base64 is an encoding, not encryption: anyone who can read the header can read the credentials.

```bash
printf 'alice:s3cret' | base64
# YWxpY2U6czNjcmV0

curl https://api.example.com/reports \
  -H "Authorization: Basic YWxpY2U6czNjcmV0"
```

Because the real password is sent each time, Basic must only be used over HTTPS, and a leaked request log is a leaked password.

## Bearer

Bearer sends an opaque or signed token that the server issued earlier. Whoever holds ("bears") the token can use it, so it needs the same care as a password, but it can be short-lived, scoped and revoked without changing the user's password.

```bash
curl https://api.example.com/reports \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
```

## Which to use

|                 | Basic                             | Bearer                    |
| --------------- | --------------------------------- | ------------------------- |
| Credential sent | Username and password             | Issued token              |
| Expires         | Never, until the password changes | Yes, by design            |
| Scopes          | No                                | Yes                       |
| Typical use     | Legacy and internal tooling       | OAuth 2.0 and modern APIs |

Prefer bearer tokens for anything new, and keep Basic for systems that cannot do better.
