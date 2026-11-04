# Azure Task Tracker — React + Node.js + Azure SQL

A small full-stack task manager intended for hands-on Azure hosting practice.

## Architecture

- **Frontend:** React + Vite
- **Backend:** Node.js + Express REST API
- **Database:** Azure SQL Database (or local SQL Server)
- **API:** `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`
- **Health check:** `GET /api/health`

## 1. Create the Azure SQL database

Create an Azure SQL logical server and database. Configure the SQL server firewall to allow your development machine's public IP. For production, prefer private networking and managed identity rather than broad public access.

Open the database Query Editor in Azure Portal or connect using SQL Server Management Studio / Azure Data Studio, then run:

```sql
-- See database/schema.sql for the complete script.
```

Run the contents of `database/schema.sql`.

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env` with your Azure SQL server, database, username and password.

For local development, set `DB_ENCRYPT=true`. Do not commit `.env` to source control.

Start the API:

```bash
npm run dev
```

API runs at `http://localhost:5000`.

Test:
- `http://localhost:5000/api/health`
- `http://localhost:5000/api/tasks`

## 3. Configure the frontend

In another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` from `.env.example` and set:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start React:

```bash
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

## 4. Build for hosting

Frontend:

```bash
cd frontend
npm run build
```

The production files are generated in `frontend/dist`.

Backend:

```bash
cd backend
npm start
```

Set these environment variables in the hosting service's application settings. Never put database credentials in React/Vite environment variables because frontend variables are visible to users.

## 5. Suggested Azure hosting

A straightforward deployment for learning:

1. **Azure App Service (Linux, Node.js):** host the Express backend.
2. **Azure SQL Database:** store tasks.
3. **Azure Static Web Apps** or **Azure Storage Static Website:** host the built React frontend.
4. Configure the frontend `VITE_API_BASE_URL` to the public backend URL, then rebuild and redeploy.
5. Configure backend `CORS_ORIGIN` to the exact frontend origin.
6. Store DB credentials in App Service application settings or Key Vault. For a production-grade setup, consider Microsoft Entra authentication / managed identity for Azure SQL.

## Notes

- This is a learning starter, not a production-ready application.
- It includes basic validation and parameterized SQL queries.
- Add authentication/authorization before exposing user-specific data publicly.
- The SQL script creates one shared task table. Anyone who can reach the API can currently read and modify all tasks; protect it before public use.
