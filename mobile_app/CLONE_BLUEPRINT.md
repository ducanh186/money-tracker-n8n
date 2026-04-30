# Mobile App Clone Blueprint

This file is the handoff package for cloning this Flutter app into a new product, including an IoT control app that talks to a different EC2 API.

## Decision First

Use Docker for:

- backend services
- nginx or API gateways
- local mock APIs
- CI build images

Do not treat Docker as the deployment format for this Flutter Android app.

For a new mobile product, the fastest path is:

1. copy the `mobile_app/` folder as the starter shell
2. keep the Flutter shell, state, and API injection pattern
3. replace the repository, models, theme, labels, and feature screens
4. point `API_BASE_URL` to the new EC2 API

## Reusable Architecture

These files are the core seam lines:

- `lib/main.dart`
  - chooses mock vs remote data using `USE_MOCK_API`
  - injects the repository through `provider`
- `lib/data/services/api_client.dart`
  - reads `API_BASE_URL` from `--dart-define`
  - enforces JSON responses
  - surfaces HTML/error bodies in exception messages
- `lib/data/repositories/money_repository.dart`
  - repository boundary between UI and transport
- `lib/ui/features/shell/money_app_shell.dart`
  - top app shell, app bar, tabs, bottom nav, quick actions

This pattern is already reusable for an IoT app. Rename the repository and models, but keep the seam.

## Best Way To Reuse This For An IoT Control App

Recommended mapping:

- `MoneyRepository` -> `DeviceRepository` or `IotRepository`
- `OverviewData` -> dashboard/device summary DTOs
- `OverviewScreen` -> device dashboard
- placeholder tabs -> devices, rooms, automations, logs, settings
- `QuickCaptureSheet` -> quick action sheet for toggles, scenes, or commands
- `AppState.selectedMonth` -> selected site, home, room, or device group

Keep these ideas exactly:

- one repository interface between UI and remote API
- one API client with a single configurable base URL
- one mock switch through `--dart-define`
- one shell that can host placeholder screens while the API catches up

## EC2 API Contract Rules

The mobile app is safest when the EC2 host behaves like this:

- public HTTPS endpoint reachable from a phone
- JSON responses for API routes
- no HTML login wall on mobile API requests
- stable base path like `https://host/api`

Do not put Cloudflare Access or another HTML login screen in front of the mobile JSON API unless the app is updated to do an explicit auth flow.

This repo already hit that failure mode: the phone received HTML instead of JSON, and `ApiClient` now exposes the response snippet so the issue is visible immediately.

## Android Build And Deploy Tips Already Verified Here

1. Windows may not have `JAVA_HOME` set even when Android Studio is installed.
2. `mobile_app/android/gradlew.bat` now falls back to Android Studio JBR/JRE automatically.
3. For nested Android tooling, it is still safest to set `JAVA_HOME` to `C:\Program Files\Android\Android Studio\jbr`.
4. If `:app:mergeDebugJavaResource` fails with missing MD5/zip-cache files, delete `build/app/intermediates/incremental/debug-mergeJavaRes` and rerun.
5. `flutter run` over wireless ADB can hang during install even when the build succeeded.
6. If that happens, use `adb install -r` and then `adb shell am start -n <package>/<activity>`.
7. If Android reports an NDK `source.properties` problem, verify the folder before deleting anything. On this repo the issue was transient and the rerun succeeded.

## Exact Reuse Flow For A New App

1. Copy `mobile_app/` into the new repo or duplicate it inside this repo as a new app folder.
2. Rename the Flutter app title, package id, icon, and primary theme.
3. Replace the domain models under `lib/data/models/`.
4. Replace `money_repository.dart` with the new domain interface.
5. Replace `remote_money_repository.dart` with the new EC2 endpoints.
6. Keep `api_client.dart`, but point `API_BASE_URL` at the new backend.
7. Keep the mock repository pattern so UI work can continue before the backend is complete.
8. Replace placeholder tabs with the new domain screens one by one.
9. Update the launch activity/package name if the app id changes.
10. Build with `build-debug-apk.ps1` before doing any manual Gradle surgery.

## Exact Build Commands

Production API:

```powershell
Set-Location D:\CODE\money-tracker-n8n\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1
```

Alternative API host:

```powershell
Set-Location D:\CODE\money-tracker-n8n\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1 -ApiBaseUrl https://your-host.example/api
```

Mock mode:

```powershell
Set-Location D:\CODE\money-tracker-n8n\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1 -UseMockApi
```

Install after build:

```powershell
Set-Location D:\CODE\money-tracker-n8n\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1 -Install -DeviceId <adb-device-id>
```

## Fast Checklist For The Next AI Agent

Read these files first:

- `mobile_app/README.md`
- `mobile_app/CLONE_BLUEPRINT.md`
- `mobile_app/lib/main.dart`
- `mobile_app/lib/data/services/api_client.dart`
- `mobile_app/lib/data/repositories/money_repository.dart`
- `mobile_app/lib/ui/features/shell/money_app_shell.dart`

Then decide:

- same app, different API host -> keep UI shell, swap `API_BASE_URL`
- same shell, different product -> keep shell and DI pattern, replace repository/models/screens
- backend-only containerization -> use Docker on the API side, not the Flutter runtime side

## Copy-Paste Prompt For A Future AI Agent

```text
Clone the Flutter mobile shell in mobile_app into a new Android app with the same architecture.

Keep:
- provider-based dependency injection
- a repository interface between UI and transport
- API base URL from --dart-define
- mock vs remote switch from --dart-define
- app shell and placeholder-first workflow

Change:
- app title, package id, theme, icons
- domain models
- repository methods and endpoint mappings
- overview/dashboard widgets and tab labels
- launch activity/package name if needed

Build using mobile_app/build-debug-apk.ps1 and do not bypass it unless the script itself is broken.
```
