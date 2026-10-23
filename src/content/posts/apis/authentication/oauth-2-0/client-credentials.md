---
title: 'The client credentials flow, end to end'
summary: 'Machine-to-machine authentication: registering the client, requesting and caching tokens, and the errors you hit first.'
date: 2026-10-18
order: 2
tags: [oauth, security]
---

Client credentials is the OAuth 2.0 flow for machine-to-machine calls. There is no user and no browser redirect: a service authenticates as itself and receives an access token it can send to an API. If you have a nightly sync job, a backend that calls Dataverse, or a webhook processor that talks to another service, this is the flow you want.

This post walks through the whole round trip: registering the client, requesting a token, using it, caching it, and the errors you will run into first.

## Overview

Two parties take part besides your code. The authorization server issues tokens, and the resource server (the API) accepts them. Your service holds a client ID and a secret or certificate, exchanges them for a token, and attaches that token to every API request until it expires.

Because nothing interactive happens, the token represents the application, not a person. Permissions are granted to the app registration ahead of time, usually by an administrator, and appear in the token as roles.

## Requesting a token

The token request is a single form-encoded POST to the token endpoint. The scope parameter names the API you want to call; with Microsoft Entra ID it is the resource URL followed by /.default.

```bash
curl -X POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token \
  -d grant_type=client_credentials \
  -d client_id=$CLIENT_ID \
  -d client_secret=$CLIENT_SECRET \
  -d scope=https://yourorg.crm.dynamics.com/.default
```

A successful response contains the token and its lifetime in seconds:

```json
{
  "token_type": "Bearer",
  "expires_in": 3599,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOi..."
}
```

## Calling the API

Send the token in the Authorization header with the Bearer scheme. The API validates the signature, the audience and the expiry on every request, so a token issued for one API will be rejected by another.

```c#
using var http = new HttpClient();
http.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", token);

var res = await http.GetAsync($"{baseUrl}/api/data/v9.2/accounts?$top=5");
res.EnsureSuccessStatusCode();
```

## Caching tokens

Requesting a new token on every call is the most common mistake with this flow. It adds a network round trip to each request and can get your client throttled by the authorization server. Cache the token and refresh it shortly before it expires.

```c#
var token = await cache.GetOrCreateAsync("api-token", async entry =>
{
    var result = await RequestTokenAsync();
    entry.AbsoluteExpirationRelativeToNow =
        TimeSpan.FromSeconds(result.ExpiresIn - 300);
    return result.AccessToken;
});
```

Refreshing five minutes early covers clock skew between your server and the authorization server. Client credentials does not issue refresh tokens, so refreshing simply means requesting a new token.

## Common errors

`invalid_client` means the client ID or secret is wrong, or the secret has expired. Secrets in Entra ID have an end date, so set a reminder or switch to a certificate.

A 401 from the API with a valid-looking token usually means the audience is wrong: the scope you requested points to a different resource than the one you are calling. Decode the token and check the `aud` claim.

A 403 means the token is fine but the app lacks permission. Check that the API permission has admin consent, and for Dataverse, that an application user exists with a security role.
