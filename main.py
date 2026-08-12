import os
import requests
from dotenv import load_dotenv

# 1. Load environment variables from .env file
load_dotenv()

token = os.getenv("TMDB_TOKEN")

# Basic check to ensure the API token is loaded
if not token:
    print("Error: TMDB_TOKEN missing from .env file.")
    exit(1)

base_url = "https://api.themoviedb.org/3"

headers = {
    "Authorization": f"Bearer {token}"
}

# 2. Prompt user for a search query (Request A)
query = input("Search for a movie: ").strip()

if not query:
    print("Search query cannot be empty.")
    exit(0)

search_url = f"{base_url}/search/movie"
params = {
    "query": query
}

# 3. Send Search Request (Request A)
try:
    response = requests.get(search_url, headers=headers, params=params)
    response.raise_for_status()  # Check for 4xx or 5xx response errors
    data = response.json()
except requests.exceptions.RequestException as e:
    print("\nAPI Error: Failed to retrieve search results from TMDB.")
    print(f"Details: {e}")
    exit(1)

# 4. Extract search results (limit to top 10)
results = data.get("results", [])[:10]

if not results:
    print(f"\nNo movies found matching '{query}'.")
    exit(0)

# Display search results list
print(f"\n--- Search Results for '{query}' ---")
for index, movie in enumerate(results, 1):
    title = movie.get("title", "Unknown Title")
    release_date = movie.get("release_date", "N/A")
    print(f"{index}. {title} ({release_date})")

# 5. Prompt user to select a movie by number
selection = input(f"\nSelect a movie (1-{len(results)}): ").strip()

if not selection.isdigit():
    print("Invalid input. Please enter a number.")
    exit(1)

choice = int(selection)
if choice < 1 or choice > len(results):
    print(f"Selection out of range. Please choose a number between 1 and {len(results)}.")
    exit(1)

# Get the selected movie's ID from Request A results
selected_movie = results[choice - 1]
movie_id = selected_movie["id"]

# 6. Send Details Request using movie_id (Request B)
details_url = f"{base_url}/movie/{movie_id}"

try:
    details_response = requests.get(details_url, headers=headers)
    details_response.raise_for_status()
    movie_details = details_response.json()
except requests.exceptions.RequestException as e:
    print(f"\nAPI Error: Failed to retrieve details for movie ID {movie_id}.")
    print(f"Details: {e}")
    exit(1)

# 7. Display detailed movie information
title = movie_details.get("title", "N/A")
tagline = movie_details.get("tagline", "")
release_date = movie_details.get("release_date", "N/A")
rating = movie_details.get("vote_average", "N/A")
vote_count = movie_details.get("vote_count", 0)
runtime = movie_details.get("runtime", "N/A")
overview = movie_details.get("overview", "No overview available.")

genres_list = [g.get("name") for g in movie_details.get("genres", []) if g.get("name")]
genres = ", ".join(genres_list) if genres_list else "N/A"

print("\n" + "=" * 50)
print(f"TITLE: {title}")
if tagline:
    print(f"TAGLINE: \"{tagline}\"")
print("=" * 50)
print(f"Release Date : {release_date}")
print(f"Rating       : {rating}/10 ({vote_count} votes)")
print(f"Runtime      : {runtime} minutes")
print(f"Genres       : {genres}")
print(f"\nOVERVIEW:\n{overview}")
print("=" * 50)