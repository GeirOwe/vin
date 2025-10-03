from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.endpoints.wines import router as wines_router

app = FastAPI(title="VIN API")

# CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple root and health endpoints
@app.get("/")
async def root():
    return {"status": "ok", "service": "VIN API", "routes": ["/api/wines"]}

@app.get("/health")
async def health():
    return {"status": "ok"}

# Routers
app.include_router(wines_router)
