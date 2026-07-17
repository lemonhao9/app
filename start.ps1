Start-Process powershell -ArgumentList "-NoExit", "-Command", "docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
"
npm run dev --prefix .\frontend
