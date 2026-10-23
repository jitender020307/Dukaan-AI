# DukaanAI

A merchant dashboard prototype with inventory, sales, customer khata, Hindi voice queries, and explainable restocking suggestions. The bundled figures are fictional sample data.

## Run locally

Prerequisites: Python 3.10+ and Node.js with npm.

1. Start the backend in one terminal:

   `python backend/server.py`

   It serves the JSON API at `http://127.0.0.1:8000`.

2. Install frontend packages once:

   `npm install`

3. Start the dashboard in another terminal:

   `npm run dev`

   Open `http://127.0.0.1:3000`.

Vite forwards `/api/*` requests to the Python backend. The overview's restocking card requests `POST /api/restock`; if the backend is offline, the UI falls back to its sample recommendation. The current forecast is a transparent 7-day weighted average, not a model trained on real merchant data.
