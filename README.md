# VIN - Wine Entry App

A full-stack application for creating wine entries with grape composition, pricing/quantity, and drinking window. Backend is FastAPI + SQLAlchemy + Pydantic; frontend is React (Vite + TypeScript + Tailwind).

## Contents
- Backend (FastAPI)
- Frontend (Vite React)
- Environment configuration
- API endpoints
- Development workflow

---

## Prerequisites
- Python 3.12+
- Node.js 18+
- macOS/Linux shell (examples use zsh)

## Backend (FastAPI)

### Setup
```bash
cd /Users/geirowe/Documents/8090SoftwareFactory/vin
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Optional: configure environment variables (see Environment section).

### Run the server
Default port 8000:
```bash
uvicorn app.main:app --reload --port 8000
```
If 8000 is in use, use 8001:
```bash
uvicorn app.main:app --reload --port 8001
```

### Database
- Default: SQLite file `vin.db` in project root
- Override with `DATABASE_URL` (e.g., PostgreSQL) if desired

### Health checks
- GET `/` → service banner
- GET `/health` → `{ "status": "ok" }`

## Frontend (Vite + React + Tailwind)

### Setup & run
```bash
cd /Users/geirowe/Documents/8090SoftwareFactory/vin/frontend
npm install
npm run dev
```
This starts the dev server on `http://localhost:5173`.

### UI features
- New Wine form with sections:
  - Wine Details (name, type, producer, vintage, location)
  - Pricing & Quantity (validated, currency formatting)
  - Drinking Window (validated; Suggest Dates via backend endpoint)
  - Grape Composition (dynamic rows, validated total ≤ 100%)
- Wine List page showing saved entries
- Toggle between New Wine and Wine List in the header

## Environment
Copy and adjust the example file:
```
/Users/geirowe/Documents/8090SoftwareFactory/vin/ENVIRONMENT.example
```
Supported variables:
- `DATABASE_URL` (optional): SQLAlchemy database URL
- `EXTERNAL_WINE_API_BASE_URL` (optional): external API base URL for suggestions
- `EXTERNAL_WINE_API_KEY` (optional): API key for suggestions

Export in your shell or use a `.env` loader of your choice.

## API Endpoints
Base URL: `http://localhost:8000` (or `8001` if you changed the port)

- GET `/` → Service banner
- GET `/health` → Healthcheck
- GET `/api/wines` → List wines with grape compositions
- POST `/api/wines` → Create a wine
  - Payload fields:
    - Required: `name`
    - Optional: `type`, `producer`, `vintage`, `country`, `district`, `subdistrict`, `purchase_price`, `quantity`, `drink_after_date`, `drink_before_date`, `grape_composition[]`
  - Validation:
    - `drink_before_date` must be later than `drink_after_date` if both present
    - If `grape_composition` provided, percentages should roughly sum to 100 (±0.5)
- GET `/api/wines/drinking-window-suggestions?wine_type=Red&vintage=2020`
  - Returns `{ drink_after_date, drink_before_date }`
  - Requires `EXTERNAL_WINE_API_*` env vars; returns 502-style errors if external service fails

## Example requests
Create a wine:
```bash
curl -X POST http://localhost:8000/api/wines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Pinot Noir",
    "type": "Red",
    "producer": "Acme Winery",
    "vintage": 2021,
    "country": "USA",
    "district": "Sonoma",
    "subdistrict": "Russian River",
    "purchase_price": 35.5,
    "quantity": 6,
    "drink_after_date": "2026-01-01",
    "drink_before_date": "2030-12-31",
    "grape_composition": [
      { "grape_variety": "Pinot Noir", "percentage": 100 }
    ]
  }'
```

Get suggestions (requires external API configured):
```bash
curl "http://localhost:8000/api/wines/drinking-window-suggestions?wine_type=Red&vintage=2020"
```

## Troubleshooting
- Address already in use: run on another port (e.g., `--port 8001`) or kill the existing process
- `ModuleNotFoundError: httpx`: ensure venv is active and run `pip install -r requirements.txt`
- CORS: backend enables CORS for `http://localhost:5173`

## Tech Stack
- Backend: FastAPI, SQLAlchemy 2.x, Pydantic v2, httpx
- Frontend: React 18, Vite 7, TypeScript, Tailwind

## Project Structure (simplified)
```
vin/
  app/
    api/endpoints/wines.py
    core/config.py
    database.py
    main.py
    models.py
    schemas.py
    services/wine_api_service.py
  frontend/
    src/
      components/
        DrinkingWindowInput.tsx
        GrapeCompositionInput.tsx
        PricingQuantityInput.tsx
        WineDetailsInput.tsx
        WineEntryForm.tsx
        WineList.tsx
        ui/{button.tsx,input.tsx,label.tsx}
      hooks/useApi.ts
      App.tsx
      main.tsx
    index.html
    tailwind.config.js
    tsconfig.json
    vite.config.ts
  requirements.txt
  ENVIRONMENT.example
  README.md
```

## License
Internal project (add license if needed).
