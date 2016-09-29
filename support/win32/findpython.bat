@echo off
:: This batch script finds a Windows python installation suitable for use by Titanium

set pythonPath=
set pythonHomeDir=
set latestPython=
set mobileSDK=%~dp0
set win32ModulesDir=%mobileSDK%..\..\..\modules\win32

:: Check PYTHON_HOME and PYTHONHOME environment variables
if not ()==(%PYTHON_HOME%) if exist %PYTHON_HOME%\python.exe set pythonPath=%PYTHON_HOME%\python.exe
if not ()==(%PYTHONHOME%) if exist %PYTHONHOME%\python.exe set pythonPath=%PYTHONHOME%\python.exe
if ()==(%pythonPath%) goto FindPathPython
goto FoundPython

:: Check the PATH
:FindPathPython
set PATH_SPACES=%PATH:;= %
for %%P in ("%PATH:;=" "%") do if exist %%P\python.exe set pythonHomeDir=%%P
if ()==(%pythonHomeDir%) goto FindTiPython

:FoundPathPython
set pythonPath=%pythonHomeDir:~1,-1%\python.exe
goto FoundPython

:: Check for the latest version of the Titanium python module (last in the list)
:FindTiPython
for /D %%v in ("%win32ModulesDir%\python\*") do set latestPython=%%~fv
if ()==(%latestPython%) goto FindDefaultPythonDirs

:FoundTiPython
set pythonPath=%latestPython%\python.exe
goto FoundPython

:: Check the default installation directories
:FindDefaultPythonDirs
if exist C:\Python26\python.exe (
	set pythonPath=C:\Python26\python.exe
) else if exist C:\Python25\python.exe (
	set pythonPath=C:\Python25\python.exe
)
if ()==(%pythonPath%) goto NoPython

:FoundPython
goto Exit

:NoPython
echo Error: No python executable could be found on your system
exit /b 1

:Exit
