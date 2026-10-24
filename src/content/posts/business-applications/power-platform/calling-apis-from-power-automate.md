---
title: 'Calling APIs from Power Automate'
summary: 'The HTTP action, custom connectors, and when to use each.'
date: 2026-08-28
order: 1
tags: [power-automate, api]
---

<!-- seed content: replace before publishing -->

Power Automate can call almost any REST API. The question is not whether it can, but where to put the call so the flow stays readable and the credentials stay safe.

## The HTTP action

The HTTP action is the quickest way to make a call. You set the method, the URI, headers and body, and the response arrives as dynamic content. It is the right choice for a one-off call in a single flow.

```json
{
  "method": "POST",
  "uri": "https://api.example.com/v1/orders",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer @{variables('accessToken')}"
  },
  "body": {
    "customerId": "@{triggerOutputs()?['body/customerid']}",
    "total": "@{variables('orderTotal')}"
  }
}
```

Parse the response with a **Parse JSON** action so later steps can pick fields from a list instead of writing expressions by hand.

## Custom connectors

A custom connector wraps an API definition (an OpenAPI file or a set of hand-defined actions) and gives it a name, an icon and a managed authentication setup. Use one when several flows or several makers call the same API: the connection holds the credential, and makers see friendly actions instead of raw URLs.

## Choosing

| Need                         | Use              |
| ---------------------------- | ---------------- |
| One flow, one call           | HTTP action      |
| Reuse across flows or makers | Custom connector |
| OAuth sign-in per user       | Custom connector |

Whichever you pick, keep secrets in connection settings or environment variables, not in the flow definition, and turn on secure inputs and outputs for actions that handle tokens.
