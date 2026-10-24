---
title: 'Retry policies with backoff'
summary: 'Retrying 429 and 503 responses without making an outage worse.'
date: 2026-10-09
order: 2
tags: [reliability, http]
---

<!-- seed content: replace before publishing -->

A retry that fires immediately and forever turns a brief hiccup into an outage: every client hammers the struggling service at the same moment. A good policy retries only what is safe, waits longer each time, and adds randomness so clients spread out.

## What to retry

Retry network timeouts, `429 Too Many Requests`, `502`, `503` and `504`. Do not retry other `4xx` responses: the request is wrong and will fail the same way again. Only retry methods that are safe to repeat (`GET`, `PUT`, `DELETE`) unless the API supports an idempotency key.

## Exponential backoff with jitter

Double the delay after each attempt up to a cap, then pick a random delay between zero and that value. Randomising ("full jitter") stops a crowd of clients from retrying in lockstep.

```ts
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(url: string, init?: RequestInit, maxAttempts = 5) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, init).catch(() => null);
    if (response && ![429, 502, 503, 504].includes(response.status)) return response;
    if (attempt === maxAttempts) throw new Error(`Giving up after ${attempt} attempts`);

    const retryAfter = Number(response?.headers.get('Retry-After'));
    const backoff = Math.random() * Math.min(30_000, 500 * 2 ** attempt);
    await sleep(retryAfter > 0 ? retryAfter * 1000 : backoff);
  }
}
```

## Respect the server

If the response includes `Retry-After`, wait at least that long instead of using your own schedule. Put a limit on both the number of attempts and the total time, and log each retry so a flaky dependency shows up in your metrics before it shows up in a customer's inbox.
