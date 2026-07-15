import json
import os
from datasets import load_dataset

def build():
    print("Loading dataset from Hugging Face...")
    # Loading a popular movie dataset
    dataset = load_dataset("Pablinho/movies-dataset", split="train")
    
    movies_list = []
    print(f"Dataset loaded with {len(dataset)} records. Processing top 1000...")
    
    # Process top 1000 movies
    count = 0
    for i, row in enumerate(dataset):
        if count >= 1000:
            break
            
        # Get title
        title = row.get("Title")
        if not title:
            continue
            
        # Get overview
        overview = row.get("Overview") or "No description available."
        
        # Get genres
        genre = str(row.get("Genre", "Unknown"))
            
        # Rating
        try:
            rating = float(row.get("Vote_Average", 0.0))
        except:
            rating = 0.0
            
        # Poster logic
        poster_path = row.get("Poster_Url")
        if poster_path and isinstance(poster_path, str) and len(poster_path) > 5:
            poster = poster_path
        else:
            poster = f"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80"
            
        # Append to our list in the format expected by the app
        movie_obj = {
            "id": count + 1,
            "title": title,
            "genre": genre,
            "description": overview,
            "rating": round(rating, 1),
            "poster": poster
        }
        
        movies_list.append(movie_obj)
        count += 1

    # Save to data/movies.json
    output_path = os.path.join(os.path.dirname(__file__), 'data', 'movies.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(movies_list, f, indent=2)
        
    print(f"Successfully generated {len(movies_list)} movies in {output_path}")

if __name__ == "__main__":
    build()
