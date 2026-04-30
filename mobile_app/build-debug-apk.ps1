param(
    [string]$ApiBaseUrl = 'https://almoneytracker.live/api',
    [switch]$UseMockApi,
    [switch]$Install,
    [string]$DeviceId,
    [string]$LaunchActivity = 'com.almoneytracker.mobile_app/.MainActivity'
)

$ErrorActionPreference = 'Stop'

function Resolve-JavaHome {
    if ($env:JAVA_HOME) {
        $javaExe = Join-Path $env:JAVA_HOME 'bin\java.exe'
        if (Test-Path $javaExe) {
            return $env:JAVA_HOME
        }
    }

    $candidates = @(
        (Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'),
        (Join-Path $env:ProgramFiles 'Android\Android Studio\jre'),
        (Join-Path $env:LocalAppData 'Programs\Android Studio\jbr'),
        (Join-Path $env:LocalAppData 'Programs\Android Studio\jre')
    )

    foreach ($candidate in $candidates) {
        if (-not $candidate) {
            continue
        }

        $javaExe = Join-Path $candidate 'bin\java.exe'
        if (Test-Path $javaExe) {
            return $candidate
        }
    }

    throw 'JAVA_HOME is not configured and no Android Studio JBR/JRE was found.'
}

function Resolve-AdbPath {
    $sdkAdb = Join-Path $env:LocalAppData 'Android\sdk\platform-tools\adb.exe'
    if (Test-Path $sdkAdb) {
        return $sdkAdb
    }

    $adbCommand = Get-Command adb -ErrorAction SilentlyContinue
    if ($adbCommand) {
        return $adbCommand.Source
    }

    throw 'adb.exe was not found. Install Android platform-tools or add adb to PATH.'
}

function Get-ConnectedDeviceId {
    param([string]$AdbPath)

    $devices = & $AdbPath devices | Select-Object -Skip 1 | Where-Object {
        $_ -match '\tdevice$'
    } | ForEach-Object {
        ($_ -split '\s+')[0]
    }

    if ($devices.Count -eq 1) {
        return $devices[0]
    }

    if ($devices.Count -eq 0) {
        throw 'No connected Android device was found. Pass -DeviceId after reconnecting adb.'
    }

    throw 'Multiple adb devices are connected. Pass -DeviceId explicitly.'
}

$appRoot = Split-Path -Parent $PSCommandPath
Set-Location $appRoot

$env:JAVA_HOME = Resolve-JavaHome
if ($env:PATH -notlike "*$($env:JAVA_HOME)\\bin*") {
    $env:PATH = "$($env:JAVA_HOME)\bin;$env:PATH"
}

$staleMergeDir = Join-Path $appRoot 'build\app\intermediates\incremental\debug-mergeJavaRes'
if (Test-Path $staleMergeDir) {
    Remove-Item $staleMergeDir -Recurse -Force
}

$flutterCommand = Get-Command flutter -ErrorAction Stop
$buildArgs = @('build', 'apk', '--debug')

if ($UseMockApi) {
    $buildArgs += '--dart-define=USE_MOCK_API=true'
} else {
    $buildArgs += "--dart-define=API_BASE_URL=$ApiBaseUrl"
}

Write-Host "Using JAVA_HOME=$env:JAVA_HOME"
Write-Host "Running: flutter $($buildArgs -join ' ')"

& $flutterCommand.Source @buildArgs
if ($LASTEXITCODE -ne 0) {
    throw "flutter build apk failed with exit code $LASTEXITCODE"
}

$apkPath = Join-Path $appRoot 'build\app\outputs\flutter-apk\app-debug.apk'
if (-not (Test-Path $apkPath)) {
    throw "APK not found at $apkPath"
}

Get-Item $apkPath | Select-Object FullName, Length, LastWriteTime | Format-List

if (-not $Install) {
    return
}

$adbPath = Resolve-AdbPath
if (-not $DeviceId) {
    $DeviceId = Get-ConnectedDeviceId -AdbPath $adbPath
}

Write-Host "Installing to device $DeviceId"

& $adbPath -s $DeviceId install -r $apkPath
if ($LASTEXITCODE -ne 0) {
    throw "adb install failed with exit code $LASTEXITCODE"
}

& $adbPath -s $DeviceId shell am start -n $LaunchActivity
if ($LASTEXITCODE -ne 0) {
    throw "adb launch failed with exit code $LASTEXITCODE"
}