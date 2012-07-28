@echo off

set pythonPath=
call "%~dp0findpython.bat"

if ()==(%pythonPath%) goto NoPython

"%pythonPath%" %*
goto Exit

:NoPython
exit /b 1

:Exit
