document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const autocompleteResults = document.getElementById('autocomplete-results');
    const modal = document.getElementById('postModal');
    const closeButton = document.querySelector('.close-button');
    let debounceTimer;

    // Search and autocomplete functionality
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const searchTerm = e.target.value.trim();
        
        if (searchTerm === '') {
            hideAutocomplete();
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
                if (!response.ok) throw new Error('Search failed');
                const results = await response.json();
                displayAutocompleteResults(results, searchTerm);
            } catch (error) {
                console.error('Error searching:', error);
                autocompleteResults.innerHTML = '<div class="result-item error">Error searching posts</div>';
            }
        }, 300);
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!autocompleteResults.contains(e.target) && e.target !== searchInput) {
            hideAutocomplete();
        }
    });

    // Close modal when clicking close button
    closeButton.addEventListener('click', () => {
        closeModal();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

function displayAutocompleteResults(results, searchTerm) {
    const autocompleteResults = document.getElementById('autocomplete-results');
    autocompleteResults.innerHTML = '';

    if (results.length === 0) {
        autocompleteResults.innerHTML = '<div class="result-item">No posts found</div>';
    } else {
        results.forEach(post => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // Create preview text with context around the matched term
            const previewText = createPreviewText(post.content, searchTerm);
            
            resultItem.innerHTML = `
                <h3>${post.title}</h3>
                <div class="date">${post.date}</div>
                <div class="preview">${previewText}</div>
            `;
            
            resultItem.addEventListener('click', () => showPost(post));
            autocompleteResults.appendChild(resultItem);
        });
    }

    autocompleteResults.classList.add('active');
}

function createPreviewText(content, searchTerm) {
    const maxLength = 150;
    const lowerContent = content.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const index = lowerContent.indexOf(lowerSearchTerm);
    
    if (index === -1) {
        return content.substring(0, maxLength) + '...';
    }
    
    let start = Math.max(0, index - 60);
    let end = Math.min(content.length, index + 90);
    
    let preview = content.substring(start, end);
    if (start > 0) preview = '...' + preview;
    if (end < content.length) preview = preview + '...';
    
    return preview;
}

function showPost(post) {
    const modalContent = document.getElementById('modalContent');
    
    // Sanitize and process the content to properly display media
    const sanitizedContent = post.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/onclick|onerror|onload/gi, '');
    
    modalContent.innerHTML = `
        <h1 class="post-title">${post.title}</h1>
        <div class="post-date">${post.date}</div>
        <div class="post-body">
            ${sanitizedContent}
        </div>
    `;

    // Add responsive behavior to media elements
    modalContent.querySelectorAll('img, video').forEach(media => {
        media.style.maxWidth = '100%';
        media.style.height = 'auto';
        
        if (media.tagName === 'VIDEO') {
            media.setAttribute('controls', '');
            media.setAttribute('controlsList', 'nodownload');
        }
    });
    
    const modal = document.getElementById('postModal');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    hideAutocomplete();
}

function closeModal() {
    const modal = document.getElementById('postModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function hideAutocomplete() {
    const autocompleteResults = document.getElementById('autocomplete-results');
    autocompleteResults.classList.remove('active');
}
