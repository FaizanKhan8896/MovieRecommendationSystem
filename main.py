from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from recommender import get_movies, get_recommendations, search_movies, reload_model

app = FastAPI(title="Movie Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup paths
base_dir = os.path.dirname(__file__)
static_path = os.path.join(base_dir, "static")
templates_path = os.path.join(base_dir, "templates")

# Ensure directories exist
os.makedirs(static_path, exist_ok=True)
os.makedirs(templates_path, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=static_path), name="static")
templates = Jinja2Templates(directory=templates_path)

import json

# HTML Route
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # Fetch all movies to inject into the datalist for autocomplete and initial render
    all_movies = get_movies(1000)
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "movies_json": json.dumps(all_movies),
            "all_movies": all_movies
        }
    )

# API Endpoints
@app.get("/api/movies")
def get_trending_movies(limit: int = Query(50, ge=1, le=100)):
    return {"movies": get_movies(limit)}

@app.get("/api/search")
def search(q: str = Query(..., min_length=1)):
    return {"movies": search_movies(q)}

@app.get("/api/recommend/{movie_id}")
def recommend(movie_id: int):
    recommendations = get_recommendations(movie_id)
    if not recommendations:
        all_m = get_movies(2000)
        if movie_id not in [m['id'] for m in all_m]:
            raise HTTPException(status_code=404, detail="Movie not found")
    return {"recommendations": recommendations}

@app.post("/api/reload")
def reload_dataset():
    reload_model()
    return {"status": "success", "message": "Dataset and model reloaded successfully"}
