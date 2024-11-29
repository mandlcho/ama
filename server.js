const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const cheerio = require('cheerio');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create posts directory if it doesn't exist
const postsDir = path.join(__dirname, 'posts');
if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
}

// Function to parse post metadata from HTML file
async function parsePost(filename) {
    const filePath = path.join(__dirname, 'posts', filename);
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const $ = cheerio.load(content);
    
    return {
        id: filename.replace('.html', ''),
        title: $('title').text(),
        date: $('meta[name="date"]').attr('content'),
        author: $('meta[name="author"]').attr('content'),
        tags: ($('meta[name="tags"]').attr('content') || '').split(','),
        category: $('meta[name="category"]').attr('content'),
        excerpt: $('.content p').first().text().slice(0, 200) + '...',
        url: `/posts/${filename}`
    };
}

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const files = await fsPromises.readdir(path.join(__dirname, 'posts'));
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        const posts = await Promise.all(
            htmlFiles.map(filename => parsePost(filename))
        );
        
        // Sort by date descending
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json(posts);
    } catch (error) {
        console.error('Error reading posts:', error);
        res.status(500).json({ error: 'Failed to read posts' });
    }
});

// Search posts
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q.toLowerCase();
        const files = await fsPromises.readdir(path.join(__dirname, 'posts'));
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        const posts = await Promise.all(
            htmlFiles.map(filename => parsePost(filename))
        );
        
        const results = posts.filter(post => 
            post.title.toLowerCase().includes(query) ||
            post.tags.some(tag => tag.toLowerCase().includes(query)) ||
            post.category.toLowerCase().includes(query)
        );
        
        res.json(results);
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Save post
app.post('/api/save-post', async (req, res) => {
    try {
        const { filename, content } = req.body;
        const filePath = path.join(__dirname, 'posts', filename);
        
        await fsPromises.writeFile(filePath, content, 'utf-8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({ error: 'Failed to save post' });
    }
});

// Delete post
app.delete('/api/posts/:filename', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'posts', req.params.filename);
        await fsPromises.unlink(filePath);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Serve individual posts
app.get('/posts/:filename', (req, res) => {
    res.sendFile(path.join(__dirname, 'posts', req.params.filename));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
