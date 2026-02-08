# Deploy on Railway (Frontend + Backend + MySQL)

This repo is a monorepo:
- Frontend (React CRA): `role-based-login-frontend/`
- Backend (Spring Boot): `rollbasedlogin/`

Railway cannot run everything inside a *single* service, but you can run everything inside a *single Railway project*:
- 1 service for the Spring Boot backend
- 1 service for the React frontend (served as static files)
- 1 MySQL database (Railway plugin)

## 1) Create a Railway project
- Railway → New Project → **Deploy from GitHub repo**

## 2) Add MySQL
- In the Railway project → **New** → **Database** → **MySQL**
- Railway will create environment variables like: `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`.

## 3) Deploy the backend service (Spring Boot)
Create a new service from the same repo.

**Service settings**
- Root directory: `rollbasedlogin`

**Build command**
- `chmod +x mvnw && ./mvnw -DskipTests package`

**Start command**
- `java -jar target/*.jar`

**Backend environment variables** (Railway → Service → Variables)
- `SPRING_DATASOURCE_URL=jdbc:mysql://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}`
- `SPRING_DATASOURCE_USERNAME=${MYSQLUSER}`
- `SPRING_DATASOURCE_PASSWORD=${MYSQLPASSWORD}`
- `app.cors.allowed-origins=https://*.up.railway.app,http://localhost:3000`

Optional (only if you want OTP emails from Railway)
- `SPRING_MAIL_USERNAME=smarthremployeedashboard@gmail.com`
- `SPRING_MAIL_PASSWORD=<your Gmail App Password>`
- `APP_MAIL_FROM=smarthremployeedashboard@gmail.com`

Notes
- The backend already supports Railway’s dynamic port via `server.port=${PORT:2222}`.
- If you see `mvn: command not found`, your service is not using the Java provider; re-check Root directory and redeploy so Railway picks up `rollbasedlogin/nixpacks.toml`.

## 4) Deploy the frontend service (React)
Create another new service from the same repo.

**Service settings**
- Root directory: `role-based-login-frontend`

**Build command**
- `npm ci && npm run build`

**Start command**
- `npm run start:prod`

**Frontend environment variables**
- `REACT_APP_API_BASE_URL=https://<YOUR_BACKEND_PUBLIC_DOMAIN>`

Where to get the backend public domain
- Open the backend service in Railway → Settings/Networking → copy the public URL.

### Troubleshooting: `npm: not found`
If you see a build error like `/bin/bash: npm: command not found`, it means the service is **not building with the Node provider**.

Fix:
- Confirm the frontend service **Root directory** is exactly: `role-based-login-frontend`
- Redeploy so Railway picks up `role-based-login-frontend/nixpacks.toml` and `.nvmrc`
- Ensure you are using **Nixpacks** (no custom Dockerfile override)

## 5) Update backend CORS to your frontend domain
After the frontend deploys, set on the backend service:
- `app.cors.allowed-origins=https://<YOUR_FRONTEND_PUBLIC_DOMAIN>,http://localhost:3000`

Then redeploy/restart the backend service.

## 6) Verify
- Frontend URL loads.
- Login triggers OTP and calls backend successfully.
- Backend can reach MySQL (no `localhost` in DB URL).

