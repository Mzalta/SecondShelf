// ==========================================
// SecondShelf - Main JavaScript File
// ==========================================

// Data Management
let bookListings = [];
let favorites = [];

// Initialize data from localStorage
function initializeData() {
    const storedListings = localStorage.getItem('bookListings');
    const storedFavorites = localStorage.getItem('favorites');
    
    if (storedListings) {
        bookListings = JSON.parse(storedListings);
    }
    
    if (storedFavorites) {
        favorites = JSON.parse(storedFavorites);
    }
}

// Save data to localStorage
function saveListings() {
    localStorage.setItem('bookListings', JSON.stringify(bookListings));
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Display book listings on the homepage
function displayListings(listings = bookListings) {
    const container = document.getElementById('book-listings');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (listings.length === 0) {
        container.innerHTML = `
            <div class="no-listings">
                <p>No book listings yet. Be the first to add one!</p>
                <a href="add.html" class="btn btn-primary">Add Your First Book</a>
            </div>
        `;
        return;
    }
    
    listings.forEach((book, index) => {
        const card = createBookCard(book, index);
        container.appendChild(card);
    });
    
    updateResultsCount(listings.length);
}

// Create a book card element
function createBookCard(book, index) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const currentUser = getCurrentUser();
    const isOwner = book.poster && book.poster === currentUser;
    
    card.innerHTML = `
        <h3>${escapeHtml(book.title)}</h3>
        <div class="book-meta">
            <p><strong>Author:</strong> ${escapeHtml(book.author)}</p>
            <p><strong>Course:</strong> ${escapeHtml(book.course)}</p>
            <p><strong>Price:</strong> ${escapeHtml(book.price)}</p>
            ${book.poster ? `<p><strong>Posted by:</strong> ${escapeHtml(book.poster)}</p>` : ''}
        </div>
        <p class="book-contact"><strong>Contact:</strong> ${escapeHtml(book.contact)}</p>
        <div class="card-actions">
            <button class="btn btn-favorite" onclick="toggleFavorite(${index})">
                ${isFavorite(index) ? '★ Saved' : '☆ Save to Favorites'}
            </button>
            ${isOwner ? `<button class="btn btn-danger" onclick="markAsSold(${index})">
                Mark as Sold
            </button>` : ''}
        </div>
    `;
    return card;
}

// Display favorites on favorites page
function displayFavorites() {
    const container = document.getElementById('favorite-listings');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="no-listings">
                <p>You haven't saved any favorites yet.</p>
                <a href="index.html" class="btn btn-primary">Browse Listings</a>
            </div>
        `;
        return;
    }
    
    const favoriteListings = bookListings.filter(book => 
        favorites.includes(bookListings.indexOf(book))
    );
    
    favoriteListings.forEach((book, index) => {
        const originalIndex = bookListings.indexOf(book);
        const card = createBookCard(book, originalIndex);
        container.appendChild(card);
    });
}

// Mark book as sold and remove listing
function markAsSold(index) {
    if (bookListings[index]) {
        // Remove from bookListings array
        bookListings.splice(index, 1);
        
        // Update favorites indices (since we removed an item, all indices after the removed one shift down)
        favorites = favorites
            .filter(favIndex => favIndex !== index) // Remove the deleted item from favorites
            .map(favIndex => favIndex > index ? favIndex - 1 : favIndex); // Adjust indices
        
        saveListings();
        saveFavorites();
        displayListings();
        
        if (document.getElementById('favorite-listings')) {
            displayFavorites();
        }
    }
}

// Toggle favorite status
function toggleFavorite(index) {
    const favoriteIndex = favorites.indexOf(index);
    
    if (favoriteIndex > -1) {
        favorites.splice(favoriteIndex, 1);
    } else {
        favorites.push(index);
    }
    
    saveFavorites();
    displayListings();
    
    if (document.getElementById('favorite-listings')) {
        displayFavorites();
    }
}

// Check if book is favorite
function isFavorite(index) {
    return favorites.includes(index);
}

// Get current user (or set a default)
function getCurrentUser() {
    let currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        // Set a default username if none exists
        currentUser = 'Guest';
        localStorage.setItem('currentUser', currentUser);
    }
    return currentUser;
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    const posterName = document.getElementById('poster-name').value;
    
    // Update current user if name is provided
    if (posterName) {
        localStorage.setItem('currentUser', posterName);
    }
    
    const formData = {
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        course: document.getElementById('book-course').value,
        price: document.getElementById('book-price').value,
        contact: document.getElementById('contact-info').value,
        poster: posterName,
        sold: false
    };
    
    bookListings.push(formData);
    saveListings();
    
    // Show success message
    document.getElementById('add-book-form').classList.add('hidden');
    document.getElementById('success-message').classList.remove('hidden');
    
    // Reset form
    event.target.reset();
}

// Search and filter functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
            displayListings();
            return;
        }
        
        const filtered = bookListings.filter(book => 
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.course.toLowerCase().includes(query)
        );
        
        displayListings(filtered);
    });
}

// Update results count
function updateResultsCount(count) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `Showing ${count} listing${count !== 1 ? 's' : ''}`;
    }
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Page initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    
    // Setup form submission
    const form = document.getElementById('add-book-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Setup search functionality
    setupSearch();
    
    // Display appropriate content based on page
    if (document.getElementById('book-listings') && 
        !document.getElementById('favorite-listings')) {
        displayListings();
    }
    
    if (document.getElementById('favorite-listings')) {
        displayFavorites();
    }
});

// Export functions for use in global scope
window.markAsSold = markAsSold;
window.toggleFavorite = toggleFavorite;
