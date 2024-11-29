const GitHubAPI = require('./github-auth').GitHubAPI;

describe('GitHubAPI', () => {
    let githubAPI;
    const mockToken = 'test_token';
    const mockOwner = 'testuser';
    const mockRepo = 'testrepo';

    beforeEach(() => {
        githubAPI = new GitHubAPI(mockToken, mockOwner, mockRepo);
        
        // Reset fetch mock before each test
        fetch.restore();
    });

    test('constructor sets correct base URL', () => {
        expect(githubAPI.baseURL).toBe(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/`);
    });

    test('listFiles handles successful response', async () => {
        const mockFiles = [
            { name: 'post1.html', path: 'posts/post1.html' },
            { name: 'post2.html', path: 'posts/post2.html' }
        ];

        fetch.mock(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/posts/`, {
            status: 200,
            body: mockFiles
        });

        const files = await githubAPI.listFiles('posts/');
        expect(files).toEqual(mockFiles);
    });

    test('listFiles handles 404 error', async () => {
        fetch.mock(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/posts/`, {
            status: 404,
            body: { message: 'Not Found' }
        });

        await expect(githubAPI.listFiles('posts/')).rejects.toThrow('GitHub API Error: 404');
    });

    test('createOrUpdateFile creates file successfully', async () => {
        const mockPath = 'posts/test-post.html';
        const mockContent = '<html><body>Test Post</body></html>';
        const mockMessage = 'Create test post';

        fetch.mock(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/posts/`, {
            status: 200,
            body: [] // Simulating directory exists
        });

        fetch.mock(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/${mockPath}`, {
            status: 201,
            body: {
                content: {
                    path: mockPath
                }
            }
        });

        const result = await githubAPI.createOrUpdateFile(mockPath, mockContent, mockMessage);
        
        expect(result.content.path).toBe(mockPath);
        
        // Verify fetch was called with correct parameters
        const lastCall = fetch.lastCall(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/${mockPath}`);
        expect(lastCall[1].method).toBe('PUT');
        expect(lastCall[1].headers['Authorization']).toBe(`token ${mockToken}`);
    });

    test('createOrUpdateFile handles file creation error', async () => {
        const mockPath = 'posts/test-post.html';
        const mockContent = '<html><body>Test Post</body></html>';
        const mockMessage = 'Create test post';

        fetch.mock(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/posts/`, {
            status: 404 // Directory doesn't exist
        });

        fetch.mock(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/posts/README.md`, {
            status: 201 // Successfully created placeholder
        });

        fetch.mock(`https://api.github.com/repos/${mockOwner}/${mockRepo}/contents/${mockPath}`, {
            status: 422, // Unprocessable Entity
            body: { message: 'Validation Failed' }
        });

        await expect(
            githubAPI.createOrUpdateFile(mockPath, mockContent, mockMessage)
        ).rejects.toThrow('GitHub API Error: 422');
    });
});
