---
title: 'Deploying solutions with pipelines'
summary: 'Moving Dataverse solutions from dev to production with Azure DevOps and the Power Platform Build Tools.'
date: 2026-08-14
order: 1
tags: [devops, dataverse, azure-devops]
---

<!-- seed content: replace before publishing -->

Exporting a solution zip by hand and importing it into the next environment works until the first time someone imports the wrong version. A pipeline makes the path from development to production repeatable and reviewable.

## The shape of the pipeline

A typical setup has two stages. The build stage exports the unmanaged solution from the development environment, unpacks it into source control, and packs a managed solution as the build artifact. The release stage imports that artifact into test and then production, with an approval between them.

## A minimal build

The Power Platform Build Tools provide tasks for each step. This pipeline exports, unpacks and publishes the managed package:

```yaml
trigger: none

pool:
  vmImage: ubuntu-latest

steps:
  - task: PowerPlatformToolInstaller@2

  - task: PowerPlatformExportSolution@2
    inputs:
      authenticationType: PowerPlatformSPN
      PowerPlatformSPN: dev-connection
      SolutionName: ContosoCore
      SolutionOutputFile: $(Build.ArtifactStagingDirectory)/ContosoCore.zip
      Managed: true

  - publish: $(Build.ArtifactStagingDirectory)
    artifact: solution
```

Authenticate with a service connection backed by an application user, not a person's account, so the pipeline does not break when someone leaves.

## Environments and approvals

Create an Azure DevOps environment for each target and add an approval check to production. Keep environment-specific values, such as connection references and environment variables, in a deployment settings file per environment rather than editing the solution.

## Checks worth adding

Run the Solution Checker task after import into test, fail the build on high-severity findings, and tag the commit with the solution version so you can always tell what is running where.
