@echo off
cd /d "%~dp0"

REM Try standard Node.js install first
if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

REM Cursor-bundled Node (if you use Cursor but no system Node)
if exist "C:\Program Files\cursor\resources\app\resources\helpers\node.exe" (
  set "PATH=C:\Program Files\cursor\resources\app\resources\helpers;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org/ LTS
  echo         or add folder with node.exe to PATH.
  pause
  exit /b 1
)

echo Starting site at http://localhost:3000
echo Close this window to stop the server.
echo.
node "%~dp0node_modules\next\dist\bin\next" dev -p 3000
pause
