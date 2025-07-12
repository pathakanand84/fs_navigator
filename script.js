document.addEventListener('DOMContentLoaded', () => {
    const pathInput = document.getElementById('path-input');
    const depthInput = document.getElementById('depth-input');
    const hiddenCheckbox = document.getElementById('hidden-checkbox');
    const refreshBtn = document.getElementById('refresh-btn');
    const treeContainer = document.getElementById('tree-container');
    const errorContainer = document.getElementById('error-container');

    const API_URL = 'http://localhost:5000/api/tree';

    function loadTree() {
        const rawPath = pathInput.value.trim() || '~';
        const encodedPath = encodeURIComponent(rawPath);
        const depth = depthInput.value;
        const showHidden = hiddenCheckbox.checked ? 'true' : 'false';

        fetch(`${API_URL}?path=${encodedPath}&depth=${depth}&hidden=${showHidden}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.error);
                renderTree(data);
                errorContainer.textContent = '';
            })
            .catch(error => {
                errorContainer.textContent = `Error: ${error.message}`;
                treeContainer.innerHTML = '';
            });
    }

    function renderTree(node, parent = treeContainer, depth = 0) {
        if (!node) return;

        const div = document.createElement('div');
        div.className = `node depth-${depth}`;
        
        if (node.error) {
            div.innerHTML = `❌ <span class="error">${node.name}: ${node.error}</span>`;
        } 
        else if (node.type === 'directory') {
            div.innerHTML = `📁 <strong>${node.name}</strong>`;
            if (node.children) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'children';
                node.children.forEach(child => renderTree(child, childrenContainer, depth + 1));
                div.appendChild(childrenContainer);
            }
        } 
        else {
            div.innerHTML = `📄 ${node.name} (${formatBytes(node.size)})`;
        }

        parent.appendChild(div);
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Event listeners
    refreshBtn.addEventListener('click', loadTree);
    pathInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadTree();
    });

    // Initial load
    loadTree();
});