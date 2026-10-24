---
title: 'Plugins: the basics'
summary: 'What a Dataverse plugin is, where it runs in the event pipeline, and the smallest one worth writing.'
date: 2026-09-02
order: 1
tags: [dynamics, csharp, dataverse]
---

<!-- seed content: replace before publishing -->

A plugin is a .NET class that Dataverse calls when something happens to a record: a create, an update, a delete or a custom message. It runs on the server inside the platform's event pipeline, so it fires no matter whether the change came from a form, an import or the API.

## The IPlugin interface

Every plugin implements `IPlugin` and its single `Execute` method. Dataverse passes in a service provider, from which you get the execution context, a tracing service and an organization service.

```c#
public class SetAccountNumber : IPlugin
{
    public void Execute(IServiceProvider serviceProvider)
    {
        var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
        var tracing = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

        if (context.InputParameters["Target"] is not Entity account) return;

        if (!account.Contains("accountnumber"))
        {
            account["accountnumber"] = $"ACC-{DateTime.UtcNow:yyyyMMddHHmmss}";
            tracing.Trace("Generated account number {0}", account["accountnumber"]);
        }
    }
}
```

Registered on the Create message of `account` in the pre-operation stage, this fills in the account number before the row is saved, with no extra update call.

## Registering a step

A plugin does nothing until you register a step with the Plugin Registration Tool (or the `pac plugin` commands). A step names the message, the table, the pipeline stage and the execution mode. Sign the assembly, upload it, and add the step.

## Rules that save you later

- Keep plugins stateless. Dataverse can reuse the same instance, so do not store data in fields.
- Stay quick: a synchronous plugin runs inside the user's save, and the platform stops it after two minutes.
- Write to the tracing service, and read the trace on the Plug-in Trace Log when something goes wrong.
