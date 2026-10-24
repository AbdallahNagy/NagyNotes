---
title: 'Writing custom workflow steps'
summary: 'Building a custom workflow activity in C#, from input parameters to registration and debugging.'
date: 2026-10-12
order: 1
tags: [dynamics, csharp]
---

Custom workflow activities let you add your own step to the classic workflow designer in Dynamics 365. They are .NET classes that run inside the platform, take input parameters from the designer, and return output parameters the next step can use.

## When to use one

Reach for a custom step when a workflow needs logic the designer cannot express, such as a calculation or a query over related records. For new automation, Power Automate or a plugin is often the better fit; custom steps make the most sense when you are extending existing classic workflows.

## The activity class

```c#
public class AddBusinessDays : CodeActivity
{
    [Input("Start date"), RequiredArgument]
    public InArgument<DateTime> StartDate { get; set; }

    [Input("Days")]
    public InArgument<int> Days { get; set; }

    [Output("Result")]
    public OutArgument<DateTime> Result { get; set; }

    protected override void Execute(CodeActivityContext context)
    {
        var date = StartDate.Get(context);
        var days = Days.Get(context);
        while (days > 0)
        {
            date = date.AddDays(1);
            if (date.DayOfWeek is not (DayOfWeek.Saturday or DayOfWeek.Sunday)) days--;
        }
        Result.Set(context, date);
    }
}
```

The Input and Output attributes set the labels shown in the workflow designer. Keep them short; they appear in a narrow property panel.

## Registering the assembly

Sign the assembly with a strong name key, then register it with the Plugin Registration Tool. The step appears in the designer under the group name you set during registration, so pick something your makers will recognise.

## Debugging

Workflows run asynchronously, so you can't step through them in the designer. Write to the tracing service and read the output on the System Job record, or use the Plugin Registration Tool's profiler to replay an execution locally.

```c#
var tracing = context.GetExtension<ITracingService>();
tracing.Trace("Adding {0} business days to {1}", days, date);
```
