document.addEventListener('DOMContentLoaded', () => {
    // State
    const movies = window.initialMovies || [];
    let currentMovies = [...movies].slice(0, 50); // Show top 50 initially
    let activeGenre = '';
    const genres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Romance', 'Horror', 'Thriller', 'Animation'];
    
    // Elements
    const catalogGrid = document.getElementById('catalogGrid');
    const catalogTitle = document.getElementById('catalogTitle');
    const genreFilters = document.getElementById('genreFilters');
    const searchInput = document.getElementById('searchInput');
    const recommendInput = document.getElementById('recommendInput');
    const recommendBtn = document.getElementById('recommendBtn');
    const exploreBtn = document.getElementById('exploreBtn');
    
    // Recommendations section
    const recsSection = document.getElementById('recommendationsSection');
    const recsGrid = document.getElementById('recsGrid');
    const recFocusTitle = document.getElementById('recFocusTitle');
    const clearRecBtn = document.getElementById('clearRecBtn');
    const recsLoader = document.getElementById('recsLoader');
    
    // Modal
    const modal = document.getElementById('cinematicModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    // Init
    initGenres();
    renderGrid(catalogGrid, currentMovies);
    document.getElementById('catalogLoader').style.display = 'none';

    // -- Features --

    function initGenres() {
        genreFilters.innerHTML = '';
        genres.forEach(g => {
            const btn = document.createElement('button');
            btn.className = 'genre-btn';
            btn.innerText = g;
            btn.onclick = () => {
                if (activeGenre === g) {
                    activeGenre = '';
                    btn.classList.remove('active');
                    catalogTitle.innerText = searchInput.value ? 'Search Results' : 'The Collection';
                    fetchMovies(searchInput.value || null);
                } else {
                    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
                    activeGenre = g;
                    btn.classList.add('active');
                    searchInput.value = ''; // clear search
                    catalogTitle.innerText = `${g} Movies`;
                    fetchMovies(g);
                }
            };
            genreFilters.appendChild(btn);
        });
    }

    async function fetchMovies(query) {
        document.getElementById('catalogLoader').style.display = 'flex';
        catalogGrid.style.display = 'none';
        try {
            const url = query ? `/api/search?q=${encodeURIComponent(query)}` : `/api/movies?limit=50`;
            const res = await fetch(url);
            const data = await res.json();
            renderGrid(catalogGrid, data.movies);
        } catch (e) { console.error(e); }
        document.getElementById('catalogLoader').style.display = 'none';
        catalogGrid.style.display = 'grid';
    }

    // Debounce search
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const q = e.target.value;
            activeGenre = '';
            document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
            catalogTitle.innerText = q ? 'Search Results' : 'The Collection';
            fetchMovies(q);
        }, 500);
    });

    // Recommend Button
    recommendBtn.addEventListener('click', () => {
        const val = recommendInput.value.trim().toLowerCase();
        const found = movies.find(m => m.title.toLowerCase() === val);
        if (found) {
            handleExploreSimilar(found);
        } else {
            alert("Movie not found in the current collection. Try selecting from the dropdown list.");
        }
    });

    // Explore Button (Scrolls to catalog and clears search/recs)
    exploreBtn.addEventListener('click', () => {
        searchInput.value = '';
        activeGenre = '';
        document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
        catalogTitle.innerText = 'The Collection';
        fetchMovies(null);
        recsSection.style.display = 'none'; // hide recommendations
        document.getElementById('catalogSection').scrollIntoView({ behavior: 'smooth' });
    });

    // Clear Rec Focus
    clearRecBtn.addEventListener('click', () => {
        recsSection.style.display = 'none';
    });

    // Generate Card HTML
    function renderGrid(container, list) {
        container.innerHTML = '';
        if (list.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary); font-size:1.2rem;">No cinematic matches found.</p>';
            return;
        }
        
        list.forEach(m => {
            const wrap = document.createElement('div');
            wrap.className = 'movie-card-wrapper';
            
            const card = document.createElement('div');
            card.className = 'movie-card';
            
            card.innerHTML = `
                <img src="${m.poster}" alt="${m.title}" />
                <div class="movie-card-info">
                    <div class="movie-card-title">${m.title}</div>
                    <div class="movie-card-genre">${m.genre}</div>
                </div>
            `;
            
            // 3D Hover Effect
            wrap.addEventListener('mousemove', e => {
                const rect = wrap.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -15;
                const rotateY = ((x - centerX) / centerX) * 15;
                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            });
            wrap.addEventListener('mouseleave', () => {
                card.style.transform = 'rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
            
            wrap.addEventListener('click', () => openModal(m));
            
            wrap.appendChild(card);
            container.appendChild(wrap);
        });
    }

    // Modal Logic
    let currentModalMovie = null;

    function openModal(movie) {
        currentModalMovie = movie;
        document.getElementById('modalPoster').src = movie.poster;
        document.getElementById('modalTitle').innerText = movie.title;
        document.getElementById('modalGenre').innerText = movie.genre;
        document.getElementById('modalRating').innerText = `★ ${movie.rating}`;
        document.getElementById('modalDesc').innerText = movie.description;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentModalMovie = null;
    }

    closeModalBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    
    document.getElementById('modalExploreBtn').addEventListener('click', () => {
        if (currentModalMovie) handleExploreSimilar(currentModalMovie);
    });

    // ML Recommendations
    async function handleExploreSimilar(movie) {
        closeModal();
        recsSection.style.display = 'block';
        recFocusTitle.innerText = movie.title;
        recsGrid.style.display = 'none';
        recsLoader.style.display = 'flex';
        
        setTimeout(() => {
            recsSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        try {
            const res = await fetch(`/api/recommend/${movie.id}`);
            const data = await res.json();
            
            setTimeout(() => { // Cinematic delay
                renderGrid(recsGrid, data.recommendations);
                recsLoader.style.display = 'none';
                recsGrid.style.display = 'grid';
            }, 600);
        } catch(e) {
            console.error(e);
            recsLoader.style.display = 'none';
        }
    }
});
