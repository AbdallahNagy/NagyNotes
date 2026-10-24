---
title: 'Pre-operation vs post-operation'
summary: 'Choosing the pipeline stage, and the bugs that come from picking the wrong one.'
date: 2026-09-15
order: 2
tags: [dynamics, dataverse]
---

<!-- seed content: replace before publishing -->

The stage you register a plugin step on decides what the plugin can see and what it can safely change. Most plugin bugs trace back to choosing the wrong one.

## The stages

Dataverse runs a message through four stages. You can register on three of them:

| Stage          | Number | Runs                                              |
| -------------- | ------ | ------------------------------------------------- |
| Pre-validation | 10     | Before the transaction starts, outside it         |
| Pre-operation  | 20     | Inside the transaction, before the database write |
| Post-operation | 40     | Inside the transaction, after the database write  |

## Pre-operation: change the row being saved

In pre-operation the target is still an in-memory object. Setting an attribute on it changes what gets written, and no second update is needed. Use this stage to default or validate values.

```c#
var target = (Entity)context.InputParameters["Target"];
if (target.GetAttributeValue<decimal>("discount") > 50m)
{
    throw new InvalidPluginExecutionException("Discounts above 50% need approval.");
}
```

Throwing here cancels the whole operation and shows the message to the user.

## Post-operation: react to what was saved

Post-operation runs after the write, so the row has its final id and calculated values, and related records can be created against it. Changes to the target are ignored at this point, because it has already been saved; you must call `Update` to change it, which triggers the pipeline again.

```c#
var target = (Entity)context.InputParameters["Target"];
var task = new Entity("task")
{
    ["subject"] = "Follow up with new customer",
    ["regardingobjectid"] = new EntityReference("account", target.Id),
};
service.Create(task);
```

## Picking one

Choose pre-operation to alter or reject the incoming data, and post-operation to create or update other records that need the saved row. Pre-validation is for checks that should fail before any transaction cost, and it is the right place to stop a request early.
