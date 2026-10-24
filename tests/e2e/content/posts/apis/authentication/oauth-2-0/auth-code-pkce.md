---
title: 'Auth code + PKCE for single-page apps'
summary: 'The flow to use when a person signs in from a browser or mobile app, and why PKCE replaced the implicit flow.'
date: 2026-10-06
order: 3
tags: [oauth, security, spa]
---

<!-- seed content: replace before publishing -->

A single-page app cannot keep a secret: anything shipped to the browser can be read by whoever opens the developer tools. The authorization code flow with PKCE (Proof Key for Code Exchange, pronounced "pixy") lets a public client prove that the app finishing the sign-in is the same one that started it, without a client secret.

## Why not the implicit flow

The implicit flow returned the access token directly in the redirect URL. Tokens in URLs end up in browser history, logs and referrer headers, and there was no way to bind the token to the app that asked for it. Current guidance is to use the authorization code flow with PKCE for every browser-based client.

## How PKCE works

Before redirecting, the app creates a random `code_verifier` and sends only its SHA-256 hash, the `code_challenge`. When it later exchanges the authorization code for tokens, it sends the original verifier. The authorization server hashes it again and compares. An attacker who steals the code from the redirect cannot redeem it without the verifier.

```ts
const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export async function createPkcePair() {
  const verifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: toBase64Url(new Uint8Array(digest)) };
}
```

## The two requests

First, send the browser to the authorization endpoint with the challenge. Keep the verifier in `sessionStorage` until the user comes back.

```text
GET /authorize
  ?response_type=code
  &client_id=spa-client
  &redirect_uri=https://app.example.com/callback
  &scope=openid profile api.read
  &state=af0ifjsldkj
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

Then, on the callback, check that `state` matches and exchange the code with the verifier:

```bash
curl -X POST https://auth.example.com/token \
  -d grant_type=authorization_code \
  -d client_id=spa-client \
  -d code=$CODE \
  -d redirect_uri=https://app.example.com/callback \
  -d code_verifier=$VERIFIER
```
