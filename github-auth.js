// GitHub API Authentication and Utility Functions
class GitHubAPI {
    constructor(token, owner, repo, branch = null) {
        // Remove any full URL prefixes and extract just the repo name
        this.token = token;
        this.owner = owner.replace('https://github.com/', '');
        this.repo = repo.replace('https://github.com/', '');
        this.baseURL = `https://api.github.com/repos/${this.owner}/${this.repo}`;
        
        // Determine the branch
        this.branch = branch;

        // Add logging to verify the constructed URL
        console.log('GitHub API Configuration:', {
            token: this.token ? '[REDACTED]' : 'Missing',
            owner: this.owner,
            repo: this.repo,
            baseURL: this.baseURL
        });
    }

    async determineBranch() {
        if (this.branch) return this.branch;

        try {
            // Try to get the default branch
            const response = await fetch(`${this.baseURL}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch repository info: ${response.status}`);
            }

            const repoInfo = await response.json();
            return repoInfo.default_branch || 'main';
        } catch (error) {
            console.error('Error determining branch:', error);
            return 'main'; // Fallback to 'main'
        }
    }

    async ensureDirectoryExists(path, branch) {
        try {
            // Check if the directory exists
            const dirPath = path.split('/').slice(0, -1).join('/') + '/';
            console.log('Checking directory:', dirPath);

            const response = await fetch(`${this.baseURL}/contents/${dirPath}?ref=${branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            // If directory doesn't exist, create it with a placeholder file
            if (!response.ok) {
                console.log('Directory does not exist, creating...');
                const placeholderContent = btoa('# Placeholder for directory');
                
                await this.createOrUpdateFile(
                    `${dirPath}README.md`, 
                    '# Posts Directory\n\nThis is a placeholder for the posts directory.', 
                    'Create posts directory', 
                    null, 
                    branch
                );
            }
        } catch (error) {
            console.error('Error ensuring directory exists:', error);
            throw error;
        }
    }

    async createOrUpdateFile(path, content, message, sha = null, branch = null) {
        try {
            // Determine the branch to use
            const useBranch = branch || await this.determineBranch();

            // Ensure the directory exists before creating/updating file
            await this.ensureDirectoryExists(path, useBranch);

            // Log detailed file creation information
            console.log('Attempting to create/update file:', {
                path: path,
                branch: useBranch,
                messageType: sha ? 'Update' : 'Create',
                contentLength: content.length
            });

            const payload = {
                message: message,
                content: btoa(content),
                branch: useBranch
            };

            if (sha) {
                payload.sha = sha;
            }

            const response = await fetch(`${this.baseURL}/contents/${path}`, {
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
                    body: errorBody,
                    payload: payload
                });
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating/updating file:', error);
            throw error;
        }
    }

    async listFiles(path = 'posts/', branch = null) {
        try {
            // Determine the branch to use
            const useBranch = branch || await this.determineBranch();

            const fullPath = path.startsWith('/') ? path.slice(1) : path;
            const url = `${this.baseURL}/contents/${fullPath}?ref=${useBranch}`;
            
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

    async getFileContent(path) {
        try {
            const response = await fetch(`${this.baseURL}/contents/${path}`, {
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

    async deleteFile(path, sha, message, branch = null) {
        try {
            // Determine the branch to use
            const useBranch = branch || await this.determineBranch();

            const response = await fetch(`${this.baseURL}/contents/${path}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: message,
                    sha: sha,
                    branch: useBranch
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
