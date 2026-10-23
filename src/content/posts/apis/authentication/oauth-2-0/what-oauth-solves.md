---
title: 'What OAuth solves'
summary: 'Why passing passwords between services stopped being acceptable, and the vocabulary you need before reading about any specific flow.'
date: 2026-09-30
order: 1
tags: [oauth, security]
---

<!-- seed content: replace before publishing -->

Before OAuth, an app that wanted to read your calendar asked for your calendar password. That gave it far more power than it needed, left you no way to revoke it short of changing the password, and meant every third party stored a credential that unlocked your whole account. OAuth 2.0 replaces that with a token that is limited in scope, limited in time and revocable on its own.

## The four roles

Every OAuth flow involves the same four parties, and most confusion comes from mixing them up.

- The **resource owner** is the person (or organisation) who owns the data.
- The **client** is the application that wants access on their behalf.
- The **authorization server** authenticates the owner and issues tokens.
- The **resource server** is the API that accepts those tokens.

In small systems the authorization server and the resource server are the same product, but they are different responsibilities.

## Tokens, not passwords

The client never sees the owner's password. It receives an access token, a short-lived string that the resource server accepts as proof that the owner granted specific permissions. Each permission is a scope, such as `calendar.read`.

```http
GET /v1/calendar/events HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Because the token is short-lived, a leaked token stops working on its own. Some flows also issue a refresh token, which lets the client obtain new access tokens without asking the owner again.

## Choosing a flow

The flow describes how the client obtains the token. The choice depends on who is present and what the client can keep secret.

| Situation                                        | Flow                         |
| ------------------------------------------------ | ---------------------------- |
| A service calling an API as itself               | Client credentials           |
| A person signing in from a browser or mobile app | Authorization code with PKCE |
| A server-side web app with a person signing in   | Authorization code           |

The next two posts in this folder cover the first two rows in detail.
