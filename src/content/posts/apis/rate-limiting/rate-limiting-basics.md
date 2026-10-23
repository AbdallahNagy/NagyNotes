---
title: 'Rate limiting basics'
summary: 'Fixed windows, sliding windows and token buckets, and how to read the headers an API sends back.'
date: 2026-10-03
order: 1
tags: [api-design, reliability]
---

<!-- seed content: replace before publishing -->

Rate limits protect an API from being overwhelmed by one caller. As a consumer, you rarely choose the algorithm, but knowing which one is in play explains why a request that worked a second ago is suddenly rejected.

## Three common algorithms

A **fixed window** counts requests per calendar interval, for example 100 per minute resetting on the minute. It is simple, but a client can send 100 requests at 12:00:59 and another 100 at 12:01:00.

A **sliding window** counts requests over the last N seconds from now, which removes that boundary burst at the cost of tracking more state.

A **token bucket** holds up to a fixed number of tokens that refill at a steady rate. Each request spends one token, so short bursts are allowed while the long-run average stays bounded.

```ts
class TokenBucket {
  private tokens: number;
  private last = Date.now();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
  ) {
    this.tokens = capacity;
  }

  tryTake(): boolean {
    const now = Date.now();
    this.tokens = Math.min(
      this.capacity,
      this.tokens + ((now - this.last) / 1000) * this.refillPerSecond,
    );
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
```

## Reading the response

When a limit is hit, the standard response is `429 Too Many Requests`, usually with a `Retry-After` header that gives the number of seconds to wait (or a date). Many APIs also report the budget on every response.

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 12
```

Header names vary between providers (`X-RateLimit-*` is common), so check the documentation before relying on them.

## What to do about it

Read the remaining budget and slow down before you hit zero, spread scheduled jobs out instead of firing them on the hour, and treat `Retry-After` as the minimum wait. The next post covers how to retry safely.
