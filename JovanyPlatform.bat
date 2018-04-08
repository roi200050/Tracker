start StartDB.bat
timeout 5
start nodejs\node --max-old-space-size=10192 bin\www
start chrome.exe http://localhost:3000/