// Mock the necessary global objects and functions
const fs = require('fs');
const path = require('path');

// Read the manage_posts.html file to extract JavaScript
const managePostsContent = fs.readFileSync(
    path.resolve(__dirname, 'manage_posts.html'), 
    'utf8'
);

// Extract the JavaScript functions using a simple regex
function extractFunction(content, functionName) {
    const functionRegex = new RegExp(`function\\s+${functionName}\\s*\\(([^)]*)\{([\\s\\S]*?)\\n\\}`);
    const match = content.match(functionRegex);
    return match ? match[0] : null;
}

describe('Post Management Functions', () => {
    let savePost, fetchPosts;

    beforeEach(() => {
        // Reset the DOM
        document.body.innerHTML = `
            <form id="post-form">
                <input id="postTitle" type="text" value="Test Post Title">
                <textarea id="postContent">Test post content</textarea>
                <input id="postMedia" type="text" value="https://example.com/image.jpg">
            </form>
            <ul id="postList"></ul>
        `;

        // Mock GitHub API
        window.githubAPI = {
            createOrUpdateFile: jest.fn().mockResolvedValue({
                content: { path: 'posts/test-post-title.html' }
            }),
            listFiles: jest.fn().mockResolvedValue([
                { name: 'existing-post.html', path: 'posts/existing-post.html' }
            ])
        };
    });

    test('savePost creates a post with correct HTML structure', async () => {
        // Simulate form submission
        const form = document.getElementById('post-form');
        const event = { preventDefault: jest.fn() };

        // Call savePost function (you'd need to implement this or mock it)
        await savePost(event);

        // Verify event.preventDefault was called
        expect(event.preventDefault).toHaveBeenCalled();

        // Verify GitHub API was called with correct parameters
        expect(window.githubAPI.createOrUpdateFile).toHaveBeenCalledWith(
            expect.stringContaining('posts/test-post-title.html'),
            expect.stringContaining('<title>Test Post Title</title>'),
            expect.any(String)
        );

        // Verify form was cleared
        expect(document.getElementById('postTitle').value).toBe('');
        expect(document.getElementById('postContent').value).toBe('');
        expect(document.getElementById('postMedia').value).toBe('');
    });

    test('savePost handles empty title', async () => {
        // Clear title
        document.getElementById('postTitle').value = '';
        
        // Spy on window.alert
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        // Simulate form submission
        const form = document.getElementById('post-form');
        const event = { preventDefault: jest.fn() };

        // Call savePost function
        await savePost(event);

        // Verify alert was called
        expect(alertSpy).toHaveBeenCalledWith('Please enter a post title');
        
        // Verify GitHub API was NOT called
        expect(window.githubAPI.createOrUpdateFile).not.toHaveBeenCalled();

        alertSpy.mockRestore();
    });

    test('fetchPosts retrieves and displays existing posts', async () => {
        // Call fetchPosts function
        await fetchPosts();

        // Get the post list
        const postList = document.getElementById('postList');

        // Verify posts were added to the list
        expect(postList.children.length).toBe(1);
        expect(postList.children[0].textContent).toContain('existing-post.html');
    });
});
