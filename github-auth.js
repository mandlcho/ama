// GitHub API Authentication and Utility Functions
class GitHubAPI {
    constructor(token, owner, repo) {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
        this.baseURL = `https://api.github.com/repos/${owner}/${repo}/contents/`;
    }

    async getFileContent(path) {
        try {
            const response = await fetch(`${this.baseURL}${path}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching file:', error);
            return null;
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

            return await response.json();
        } catch (error) {
            console.error('Error creating/updating file:', error);
            return null;
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

            return await response.json();
        } catch (error) {
            console.error('Error deleting file:', error);
            return null;
        }
    }

    async listFiles(path = 'posts/') {
        try {
            const response = await fetch(`${this.baseURL}${path}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }
}

// Export for use in other scripts
window.GitHubAPI = GitHubAPI;
