import json
import os
from datetime import datetime

def parse_markdown_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Basic front matter extraction
        title = "Untitled"
        date = datetime.now().strftime('%Y-%m-%d')
        tags = []
        category = "Uncategorized"
        
        # Simple front matter parsing
        lines = content.split('\n')
        if lines[0].strip() == '---':
            front_matter = []
            for line in lines[1:]:
                if line.strip() == '---':
                    break
                front_matter.append(line)
            
            # Parse front matter
            for line in front_matter:
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().lower()
                    value = value.strip().strip("'\"")
                    
                    if key == 'title':
                        title = value
                    elif key == 'date':
                        date = value
                    elif key == 'tags':
                        # Handle both comma-separated and YAML list formats
                        tags = [t.strip().strip("'\"") for t in value.strip('[]').split(',') if t.strip()]
                    elif key == 'category':
                        category = value
        
        # Extract excerpt (first 300 characters)
        content_lines = [line for line in lines if not line.startswith('---')]
        excerpt = ' '.join(content_lines)[:300] + '...' if len(' '.join(content_lines)) > 300 else ' '.join(content_lines)
        
        return {
            'title': title,
            'date': date,
            'tags': tags,
            'category': category,
            'url': os.path.basename(file_path).replace('.md', '.html'),
            'excerpt': excerpt
        }

def generate_posts_json(markdown_dir, output_file):
    posts = [
        {
            'title': "Getting Started with Mandl KB",
            'date': "2024-01-20",
            'category': "Guide",
            'tags': ["guide", "introduction", "getting started"],
            'url': "getting-started.html",
            'excerpt': "Welcome to Mandl KB! This is your personal knowledge base search engine. Learn how to effectively search and navigate through the content."
        },
        {
            'title': "Python Tips and Best Practices",
            'date': "2024-01-21",
            'category': "Programming",
            'tags': ["python", "programming", "tips", "best practices"],
            'url': "python-tips.html",
            'excerpt': "Essential Python tips and best practices every developer should know, including virtual environments, PEP 8, and documentation."
        },
        {
            'title': "Git Workflow Guide",
            'date': "2024-01-22",
            'category': "Development",
            'tags': ["git", "version control", "workflow"],
            'url': "git-workflow.html",
            'excerpt': "A practical guide to using Git effectively in your development workflow, covering basic commands and best practices."
        }
    ]
    
    # Add markdown files from directory
    for filename in os.listdir(markdown_dir):
        if filename.endswith('.md'):
            file_path = os.path.join(markdown_dir, filename)
            try:
                post = parse_markdown_file(file_path)
                posts.append(post)
            except Exception as e:
                print(f"Error parsing {filename}: {e}")
    
    # Sort posts by date, most recent first
    posts.sort(key=lambda x: x['date'], reverse=True)
    
    # Write to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    markdown_dir = r'c:\Users\mandlcho\CascadeProjects\ama-db\content\posts'
    output_file = r'c:\Users\mandlcho\CascadeProjects\blog-search\posts.json'
    generate_posts_json(markdown_dir, output_file)
    print(f"Posts JSON generated at {output_file}")
