@echo off
rem Gera o blog e abre no navegador em http://127.0.0.1:8765/blog/
cd /d "%~dp0"
call npm run gerar
cd ..
start "" http://127.0.0.1:8765/blog/
python -m http.server 8765
