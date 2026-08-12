/**
 * CineVision Web Application Client Logic
 * Handles movie searching, rendering card grids, and fetching detailed movie views.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Base TMDB Image CDN URL
    const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

    // 2. DOM Elements
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const resultsHeader = document.getElementById("results-header");
    const resultsCount = document.getElementById("results-count");
    const resultsGrid = document.getElementById("results-grid");
    const loadingSpinner = document.getElementById("loading-spinner");
    const errorBanner = document.getElementById("error-banner");
    const errorMessage = document.getElementById("error-message");
    const emptyState = document.getElementById("empty-state");

    // Modal Elements
    const modal = document.getElementById("movie-modal");
    const modalBackdrop = document.getElementById("modal-backdrop");
    const modalCloseBtn = document.getElementById("modal-close");
    const modalLoading = document.getElementById("modal-loading");
    const modalContent = document.getElementById("modal-content");
    const modalPoster = document.getElementById("modal-poster");
    const modalPosterFallback = document.getElementById("modal-poster-fallback");
    const modalTitle = document.getElementById("modal-title");
    const modalTagline = document.getElementById("modal-tagline");
    const modalRating = document.getElementById("modal-rating");
    const modalRelease = document.getElementById("modal-release");
    const modalRuntime = document.getElementById("modal-runtime");
    const modalVotes = document.getElementById("modal-votes");
    const modalGenres = document.getElementById("modal-genres");
    const modalOverview = document.getElementById("modal-overview");

    // 3. Event Listeners
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = searchInput.value.strip ? searchInput.value.strip() : searchInput.value.trim();
        if (query) {
            searchMovies(query);
        }
    });

    modalCloseBtn.addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
            closeModal();
        }
    });

    // 4. API Search Function
    async function searchMovies(query) {
        showLoadingState();
        hideError();

        try {
            // Send request to Python Flask server endpoint
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch search results.");
            }

            renderResults(data.results || [], query);
        } catch (err) {
            showError(err.message);
            hideLoadingState();
        }
    }

    // 5. Render Movie Cards Grid
    function renderResults(movies, query) {
        hideLoadingState();
        resultsGrid.innerHTML = "";

        if (!movies || movies.length === 0) {
            emptyState.classList.remove("hidden");
            resultsHeader.classList.add("hidden");
            resultsGrid.classList.add("hidden");
            return;
        }

        emptyState.classList.add("hidden");
        resultsHeader.classList.remove("hidden");
        resultsGrid.classList.remove("hidden");
        resultsCount.textContent = `${movies.length} result(s) for "${query}"`;

        movies.forEach((movie) => {
            const card = document.createElement("article");
            card.className = "movie-card";
            card.tabIndex = 0; // Keyboard navigation focusable

            const releaseYear = movie.release_date ? movie.release_date.split("-")[0] : "N/A";
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "0.0";

            let posterHTML = "";
            if (movie.poster_path) {
                posterHTML = `<img class="card-poster" src="${TMDB_IMAGE_BASE}${movie.poster_path}" alt="${escapeHTML(movie.title)} Poster" loading="lazy" />`;
            } else {
                posterHTML = `<div class="card-poster-fallback"><span>No Poster</span></div>`;
            }

            card.innerHTML = `
                <div class="card-poster-wrap">
                    ${posterHTML}
                </div>
                <div class="card-content">
                    <h3 class="card-title">${escapeHTML(movie.title)}</h3>
                    <div class="card-meta mono">
                        <span class="card-year">${releaseYear}</span>
                        <span class="card-rating">★ ${rating}</span>
                    </div>
                </div>
            `;

            // Click or Enter key opens movie details modal
            card.addEventListener("click", () => openMovieDetails(movie.id));
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openMovieDetails(movie.id);
                }
            });

            resultsGrid.appendChild(card);
        });
    }

    // 6. Fetch & Show Movie Details Modal
    async function openMovieDetails(movieId) {
        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");
        modalLoading.classList.remove("hidden");
        modalContent.classList.add("hidden");
        document.body.style.overflow = "hidden"; // Lock background scrolling

        try {
            const response = await fetch(`/api/movie/${movieId}`);
            const movie = await response.json();

            if (!response.ok) {
                throw new Error(movie.error || "Failed to fetch movie details.");
            }

            // Populate Modal Content
            modalTitle.textContent = movie.title || "Unknown Title";
            modalTagline.textContent = movie.tagline ? `"${movie.tagline}"` : "";
            modalRating.textContent = movie.vote_average ? `★ ${movie.vote_average.toFixed(1)} / 10` : "N/A";
            modalRelease.textContent = movie.release_date || "N/A";
            modalRuntime.textContent = movie.runtime ? `${movie.runtime} min` : "N/A";
            modalVotes.textContent = movie.vote_count ? movie.vote_count.toLocaleString() : "0";
            modalOverview.textContent = movie.overview || "No overview available for this title.";

            // Genres Pill Badges
            modalGenres.innerHTML = "";
            if (movie.genres && movie.genres.length > 0) {
                movie.genres.forEach((genre) => {
                    const badge = document.createElement("span");
                    badge.className = "genre-badge";
                    badge.textContent = genre.name;
                    modalGenres.appendChild(badge);
                });
            } else {
                modalGenres.textContent = "N/A";
            }

            // Poster Setup
            if (movie.poster_path) {
                modalPoster.src = `${TMDB_IMAGE_BASE}${movie.poster_path}`;
                modalPoster.alt = `${movie.title} Poster`;
                modalPoster.classList.remove("hidden");
                modalPosterFallback.classList.add("hidden");
            } else {
                modalPoster.classList.add("hidden");
                modalPosterFallback.classList.remove("hidden");
                modalPosterFallback.textContent = "No Poster Image Available";
            }

            modalLoading.classList.add("hidden");
            modalContent.classList.remove("hidden");
        } catch (err) {
            modalLoading.classList.add("hidden");
            alert(`Error loading details: ${err.message}`);
            closeModal();
        }
    }

    // 7. Modal Control Helpers
    function closeModal() {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = ""; // Restore background scrolling
    }

    // 8. State Helpers
    function showLoadingState() {
        emptyState.classList.add("hidden");
        resultsHeader.classList.add("hidden");
        resultsGrid.classList.add("hidden");
        loadingSpinner.classList.remove("hidden");
    }

    function hideLoadingState() {
        loadingSpinner.classList.add("hidden");
    }

    function showError(msg) {
        errorBanner.classList.remove("hidden");
        errorMessage.textContent = msg;
    }

    function hideError() {
        errorBanner.classList.add("hidden");
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
