# Mobile App

Flutter Android client for the Money Tracker backend.

## Current Shape

- Platform: Android-focused Flutter app under `mobile_app/`
- State: `provider`
- Data boundary: `MoneyRepository`
- Network entrypoint: `ApiClient`
- Default production API: `https://almoneytracker.live/api`
- Current UI status: overview, transactions, jars, and more tabs render app data or actions from the current mobile shell

## Docker Or Clone

Docker is useful for the backend API, reverse proxy, and CI build images.

Docker is not the runtime packaging unit for this app. This is a native Flutter Android app, so the reusable unit is the Flutter shell plus the repository/API wiring, not a long-running container.

If you want to build a new app with the same backbone, clone the mobile shell and swap the data layer, models, theme, and feature screens.

## Quick Commands

Build against production:

```powershell
Set-Location D:\CODE\money-tracker-n8n\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1
```

Build against a different EC2 API:

```powershell
Set-Location D:\CODE\money-tracker-n8n\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1 -ApiBaseUrl https://your-host.example/api
```

Build with mock data:

```powershell
Set-Location D:\CODE\money-tracker-n8n\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1 -UseMockApi
```

Build and install to an attached Android device:

```powershell
Set-Location D:\CODE\money-tracker-n8n\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1 -Install -DeviceId <adb-device-id>
```

## Start Here Before Reusing This App

Read `CLONE_BLUEPRINT.md` for the exact reuse strategy, agent handoff notes, API assumptions, and the Android build traps already solved in this repo.
