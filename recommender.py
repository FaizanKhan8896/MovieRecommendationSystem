import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import os

# Load Data
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'movies.json')

def load_movies():
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# Global initialization
movies_list = load_movies()
df = pd.DataFrame(movies_list)
cosine_sim = None

if not df.empty:
    # Combine features for content-based filtering
    # Treat NaN as empty string
    df['genre'] = df['genre'].fillna('')
    df['description'] = df['description'].fillna('')
    df['combined_features'] = df['genre'] + " " + df['description']
    
    # Compute TF-IDF matrix
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined_features'])
    
    # Compute cosine similarity
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

def reload_model():
    """Reloads the dataset and recomputes the TF-IDF matrix."""
    global movies_list, df, cosine_sim
    movies_list = load_movies()
    df = pd.DataFrame(movies_list)
    if not df.empty:
        df['genre'] = df['genre'].fillna('')
        df['description'] = df['description'].fillna('')
        df['combined_features'] = df['genre'] + " " + df['description']
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(df['combined_features'])
        cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

def get_recommendations(movie_id: int, top_n: int = 6):
    if df.empty or cosine_sim is None:
        return []
        
    try:
        # Find index of the movie
        idx = df.index[df['id'] == movie_id].tolist()[0]
    except IndexError:
        return []
    
    # Get pairwise similarity scores
    sim_scores = list(enumerate(cosine_sim[idx]))
    
    # Sort movies based on similarity scores
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    
    # Get top N similar movies (excluding the movie itself)
    sim_scores = sim_scores[1:top_n+1]
    
    # Get movie indices
    movie_indices = [i[0] for i in sim_scores]
    
    # Return the recommended movies
    recommended = df.iloc[movie_indices].to_dict('records')
    return recommended

def get_movies(limit: int = 50):
    """Return top N movies (sorted by rating usually, but here just first N)"""
    return movies_list[:limit]

def search_movies(query: str, limit: int = 20):
    """Search movies by title or genre"""
    if not query:
        return []
    query = query.lower()
    results = [m for m in movies_list if query in m['title'].lower() or query in m['genre'].lower()]
    return results[:limit]
