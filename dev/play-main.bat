@echo off
rem DRAGONSLEEP: play main (the workshop) on this PC, with no Claude session.
rem Griz, 10-17: "if we aren't going to push this to live I'll need a way to test on main when we're out of usage til tues"
rem Double-click it in Explorer. It brings the folder up to origin's main when the folder sits on main and nothing is changed
rem in it, serves the folder on port 8940 (none of the seats' ports) in a window of its own, and opens the Pocket DM in the
rem default browser. Close the server's window to stop. A door of your own: play-main.bat "?ladder" or "../?at=wet".
rem Saves at http://localhost:8940 are this address's own: not live's, not the app pane's.
setlocal
cd /d "%~dp0.."
set "PAGE=%~1"
if "%PAGE%"=="" set "PAGE=?pocket"
set "BRANCH="
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%b"
set "DIRTY="
for /f "delims=" %%s in ('git status --porcelain --untracked-files^=no') do set "DIRTY=1"
if /i not "%BRANCH%"=="main" (
  echo The folder is on %BRANCH%, not main: playing it as it stands.
) else if defined DIRTY (
  echo The folder has changes in it: playing it as it stands, not updated.
) else (
  echo Bringing the folder up to main...
  git fetch -q origin
  git merge -q --ff-only origin/main || echo Could not fast-forward: playing the folder as it stands.
)
git log -1 --format="Playing %%h  %%s"
netstat -an | find ":8940 " | find "LISTENING" >nul
if errorlevel 1 (
  start "DRAGONSLEEP main on 8940 - close to stop" /min python -m http.server 8940
  timeout /t 2 /nobreak >nul
) else (
  echo A server already answers on 8940: using it.
)
start "" "http://localhost:8940/deep16/%PAGE%&fresh=%RANDOM%"
timeout /t 5 >nul
endlocal
