@echo off

set pythonPath=
call findpython.bat

if ()==(%pythonPath%) goto NoPython

"%pythonPath%" %*
goto Exit

:NoPython
exit /b 1

:Exit
