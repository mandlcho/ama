// GitHub API Authentication and Utility Functions
class GitHubAPI {
    constructor(token, owner, repo) {
        // Remove any full URL prefixes and extract just the repo name
        this.token = token;
        this.owner = owner.replace('https://github.com/', '');
        this.repo = repo.replace('https://github.com/', '');
        this.baseURL = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/`;
        
        // Add logging to verify the constructed URL
        console.log('GitHub API Configuration:', {
            token: this.token ? '[REDACTED]' : 'Missing',
            owner: this.owner,
            repo: this.repo,
            baseURL: this.baseURL
        });
    }

    async getFileContent(path) {
        try {
            const response = await fetch(`${this.baseURL}${path}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('GitHub API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching file:', error);
            throw error;
        }
    }

    async listFiles(path = 'posts/') {
        try {
            const fullPath = path.startsWith('/') ? path.slice(1) : path;
            const url = `${this.baseURL}${fullPath}`;
            
            console.log('Attempting to list files from URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('GitHub API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
            }
            
            const files = await response.json();
            
            // Additional logging to understand file structure
            console.log('GitHub Files Response:', files);
            
            return files;
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }

    async createOrUpdateFile(path, content, message, sha = null) {
        try {
            const payload = {
                message: message,
                content: btoa(content),
                branch: 'main'
            };

            if (sha) {
                payload.sha = sha;
            }

            const response = await fetch(`${this.baseURL}${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('GitHub API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating/updating file:', error);
            throw error;
        }
    }

    async deleteFile(path, sha, message) {
        try {
            const response = await fetch(`${this.baseURL}${path}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: message,
                    sha: sha,
                    branch: 'main'
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('GitHub API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }
}

// Export for use in other scripts
window.GitHubAPI = GitHubAPI;
