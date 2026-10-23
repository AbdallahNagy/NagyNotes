---
title: "Web resources that don't fight you"
summary: 'Structuring JavaScript web resources so forms stay fast and upgrades stay painless.'
date: 2026-10-20
order: 2
tags: [dynamics, javascript]
---

<!-- seed content: replace before publishing -->

JavaScript web resources are how most Dynamics 365 form customisation is written, and they tend to rot: global functions, copy-pasted handlers and logic that breaks when a field is renamed. A little structure keeps them maintainable.

## One namespace per resource

Everything a form calls should hang off a single namespace object, so handlers cannot collide with other scripts on the form.

```javascript
var Contoso = Contoso || {};
Contoso.Account = (function () {
  'use strict';

  function onLoad(executionContext) {
    const formContext = executionContext.getFormContext();
    toggleCreditFields(formContext);
    formContext.getAttribute('paymentterms').addOnChange(onPaymentTermsChange);
  }

  function onPaymentTermsChange(executionContext) {
    toggleCreditFields(executionContext.getFormContext());
  }

  function toggleCreditFields(formContext) {
    const onCredit = formContext.getAttribute('paymentterms').getValue() === 100000001;
    formContext.getControl('creditlimit').setVisible(onCredit);
  }

  return { onLoad };
})();
```

Register `Contoso.Account.onLoad` on the form and tick "Pass execution context as first parameter".

## Use the form context, not globals

Always go through `executionContext.getFormContext()`. The old `Xrm.Page` object is deprecated and does not work correctly with multiple forms on screen.

## Keep forms fast

Avoid synchronous requests, load heavy libraries only when a handler needs them, and read several columns in one `Xrm.WebApi.retrieveRecord` call instead of one call per field. Handlers on `OnLoad` delay the whole form, so move anything non-essential to `OnChange` or a deferred call.

## Make upgrades painless

Store option-set values and logical names in constants at the top of the file, so a rename is a one-line change. Test the logic by keeping it free of direct `Xrm` calls where you can, and passing `formContext` in.
