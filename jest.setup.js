// Mock fetch for testing
global.fetch = require('fetch-mock').sandbox();

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: function(key) {
        return this.store[key] || null;
    },
    setItem: function(key, value) {
        this.store[key] = value.toString();
    },
    clear: function() {
        this.store = {};
    }
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock document and window objects
document.body.innerHTML = `
    <form id="post-form">
        <input id="postTitle" type="text">
        <textarea id="postContent"></textarea>
        <input id="postMedia" type="text">
    </form>
    <ul id="postList"></ul>
`;

// Global setup for mocking
beforeEach(() => {
    fetch.restore();
    localStorageMock.clear();
});
