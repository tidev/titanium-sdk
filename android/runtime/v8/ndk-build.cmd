:: Appcelerator Titanium Mobile
:: Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
:: Licensed under the terms of the Apache Public License
:: Please see the LICENSE included with this distribution for details.


@echo off
if "%ANDROID_NDK%" == "" (echo "Error: The path to the Android NDK must be set in the ANDROID_NDK environment variable" & exit /b %ERRORLEVEL)

set THIS_DIR=%~dp0

if %THIS_DIR:~-1%==\ set THIS_DIR=%THIS_DIR:~0,-1%

if not "%NUM_CPUS%" == "" (set ARGS=-j %NUM_CPUS%)


%ANDROID_NDK%\ndk-build.cmd NDK_APPLICATION_MK=%THIS_DIR%\Application.mk NDK_PROJECT_PATH=%THIS_DIR% NDK_MODULE_PATH=%THIS_DIR%\src\ndk-modules TI_DIST_DIR=C:\Users\qa\titanium\titanium_mobile\dist %ARGS% %*

