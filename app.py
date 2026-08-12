import os
import requests
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

TMDB_TOKEN = os.getenv("TMDB_TOKEN")
BASE_URL = "https://api.themoviedb.org/3"

def get_headers():
    """Returns authorization headers for TMDB API requests."""
    return {
        "Authorization": f"Bearer {TMDB_TOKEN}",
        "Content-Type": "application/json;charset=utf-8"
    }

@app.route("/")
def index():
    """Serves the main single-page web interface."""
    return render_template("index.html")

@app.route("/api/search")
def search_movies():
    """
    Proxies movie search requests to TMDB.
    Query param: ?query=movie_name
    """
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"error": "Query parameter cannot be empty."}), 400

    if not TMDB_TOKEN:
        return jsonify({"error": "TMDB_TOKEN missing from server configuration."}), 500

    try:
        response = requests.get(
            f"{BASE_URL}/search/movie",
            headers=get_headers(),
            params={"query": query}
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "Failed to retrieve search results from TMDB API.",
            "details": str(e)
        }), 500

@app.route("/api/movie/<int:movie_id>")
def movie_details(movie_id):
    """
    Proxies detailed movie requests to TMDB by movie ID.
    Endpoint: /api/movie/12345
    """
    if not TMDB_TOKEN:
        return jsonify({"error": "TMDB_TOKEN missing from server configuration."}), 500

    try:
        response = requests.get(
            f"{BASE_URL}/movie/{movie_id}",
            headers=get_headers()
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": f"Failed to retrieve details for movie ID {movie_id}.",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
