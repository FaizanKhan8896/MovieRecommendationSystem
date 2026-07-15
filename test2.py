import os
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
import json
from recommender import get_movies

base_dir = os.path.dirname(__file__)
templates_path = os.path.join(base_dir, "templates")
templates = Jinja2Templates(directory=templates_path)

all_movies = get_movies(10)
scope = {"type": "http", "method": "GET", "headers": []}
request = Request(scope)

try:
    templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "movies_json": json.dumps(all_movies),
            "all_movies": all_movies
        }
    )
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
