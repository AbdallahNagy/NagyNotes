---
title: 'API keys done right'
summary: 'Where API keys are still the right choice, and how to issue, scope and rotate them.'
date: 2026-09-22
order: 1
tags: [security, api-design]
---

<!-- seed content: replace before publishing -->

An API key identifies a caller; it does not say who the person behind the caller is. That makes keys a good fit for server-to-server integrations and simple public APIs, and a poor fit for anything that needs per-user permissions. If you do choose keys, a few habits keep them from becoming a liability.

## Issue keys you can look up, not recover

Generate keys from a cryptographically secure source, show the full value to the owner exactly once, and store only a hash. A short, non-secret prefix makes keys recognisable in logs and lets people tell which one leaked.

```ts
import { createHash, randomBytes } from 'node:crypto';

export function issueKey() {
  const secret = randomBytes(32).toString('base64url');
  const key = `nn_live_${secret}`;
  return { key, prefix: key.slice(0, 12), hash: createHash('sha256').update(key).digest('hex') };
}
```

A plain SHA-256 is acceptable here because the key is long and random; password-style slow hashing is for low-entropy secrets.

## Scope and limit

Give each key the smallest set of permissions it needs, tie it to an owner and an environment, and apply rate limits per key. A read-only key for a reporting job should not be able to delete anything.

## Send them in a header

Accept keys in a header such as `Authorization` or `X-API-Key`, never in the query string. URLs are logged by proxies and browsers, and a key in a URL is a key in someone's log file.

## Rotate without downtime

Allow two active keys per client so a new key can be deployed before the old one is revoked. Record the last-used time for each key, and use it to find keys that can be retired safely.
