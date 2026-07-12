const http = require('http');
const path = require('path');
const fs = require('fs');

const LANGUAGE_DIR = path.join(__dirname, '..', 'data', 'languages');
const PORT = 3000;

function getLanguageFiles() {
    try {
        if (!fs.existsSync(LANGUAGE_DIR)) {
            fs.mkdirSync(LANGUAGE_DIR, { recursive: true });
        }
        return fs.readdirSync(LANGUAGE_DIR).filter(file => file.endsWith('.json'));
    } catch (err) {
        console.error('Error reading language directory:', err.message);
        return [];
    }
}

function loadAllLanguageData() {
    const files = getLanguageFiles();
    const data = {};
    for (const file of files) {
        const langName = path.basename(file, '.json');
        const filePath = path.join(LANGUAGE_DIR, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            data[langName] = JSON.parse(content);
        } catch (e) {
            console.error(`Failed to parse ${file}:`, e.message);
            data[langName] = {};
        }
    }
    return data;
}

function generateHtml() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Language Pack IDE</title>
    <style>
        :root {
            --bg-dark: #1e1e1e;
            --bg-sidebar: #252526;
            --bg-editor: #1e1e1e;
            --bg-card: #2d2d2d;
            --bg-hover: #37373d;
            --bg-active: #094771;
            --accent-blue: #007acc;
            --text-main: #cccccc;
            --text-bright: #ffffff;
            --text-muted: #858585;
            --border-color: #3e3e42;
            --discord-bg: #313338;
            --discord-embed-bg: #2b2d31;
            --discord-accent: #5865f2;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-main);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        header {
            height: 48px;
            background-color: var(--bg-sidebar);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
        }
        .logo-area { display: flex; align-items: center; gap: 10px; font-weight: bold; color: var(--text-bright); }
        .controls { display: flex; align-items: center; gap: 12px; }
        
        select, input, textarea, button {
            background: #3c3c3c;
            color: var(--text-bright);
            border: 1px solid var(--border-color);
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 0.85rem;
            outline: none;
        }
        select:focus, input:focus, textarea:focus { border-color: var(--accent-blue); }
        button { cursor: pointer; background: var(--accent-blue); border: none; font-weight: 500; }
        button:hover { background: #0062a3; }
        button.btn-secondary { background: #4d4d4d; }
        button.btn-secondary:hover { background: #5a5a5a; }
        button.btn-danger { background: #a12626; }
        button.btn-danger:hover { background: #821f1f; }

        .workspace { display: flex; flex: 1; height: calc(100vh - 48px); }

        .sidebar {
            width: 320px;
            background-color: var(--bg-sidebar);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
        }
        .sidebar-header {
            padding: 10px 14px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .explorer-tree { flex: 1; overflow-y: auto; padding: 6px 0; }

        .tree-node { user-select: none; font-size: 0.85rem; }
        .node-row {
            display: flex;
            align-items: center;
            padding: 4px 12px;
            cursor: pointer;
            gap: 6px;
            color: var(--text-main);
        }
        .node-row:hover { background-color: var(--bg-hover); }
        .node-row.active { background-color: var(--bg-active); color: var(--text-bright); }
        .node-icon { font-size: 0.8rem; width: 16px; text-align: center; display: inline-block; }
        .node-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .type-badge {
            font-size: 0.65rem;
            padding: 1px 4px;
            border-radius: 3px;
            background: #333;
            color: #aaa;
            text-transform: uppercase;
        }
        .type-badge.embed { background: #2d4263; color: #8ab4f8; }
        .type-badge.string { background: #2b4c3f; color: #81c995; }
        .node-children { display: none; }
        .node-children.open { display: block; }

        .editor-container { flex: 1; display: flex; background-color: var(--bg-editor); overflow: hidden; }
        .editor-pane { flex: 1; padding: 20px; overflow-y: auto; border-right: 1px solid var(--border-color); }
        .preview-pane { width: 480px; background-color: #181818; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }

        .section-title { font-size: 1.1rem; color: var(--text-bright); margin-bottom: 15px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; }
        .form-group input, .form-group textarea { width: 100%; }
        .form-group textarea { min-height: 80px; resize: vertical; font-family: inherit; }

        .var-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .var-table th, .var-table td { border: 1px solid var(--border-color); padding: 6px 8px; font-size: 0.8rem; text-align: left; }
        .var-table th { background: var(--bg-card); color: var(--text-bright); }
        .var-table input { width: 100%; border: none; background: transparent; padding: 2px 4px; }
        .var-table input:focus { background: #333; }

        .discord-message-container { background-color: var(--discord-bg); border-radius: 8px; padding: 16px; display: flex; gap: 16px; font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif; color: #dbdee1; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .discord-avatar { width: 40px; height: 40px; border-radius: 50%; background-color: var(--discord-accent); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 0.9rem; flex-shrink: 0; }
        .discord-message-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .discord-header { display: flex; align-items: center; gap: 6px; }
        .discord-bot-name { color: #ffffff; font-weight: 600; font-size: 1rem; }
        .discord-bot-tag { background-color: #5865f2; color: #ffffff; font-size: 0.625rem; font-weight: 700; padding: 1px 4px; border-radius: 3px; text-transform: uppercase; line-height: 1.2; }
        .discord-timestamp { color: #949ba4; font-size: 0.75rem; margin-left: 4px; }
        .discord-embed-card { background-color: var(--discord-embed-bg); border-left: 4px solid var(--discord-accent); border-radius: 4px; padding: 12px 16px; margin-top: 4px; display: flex; flex-direction: column; gap: 8px; }
        .discord-embed-title { color: #ffffff; font-weight: 700; font-size: 0.95rem; line-height: 1.3; }
        .discord-embed-description { color: #dbdee1; font-size: 0.875rem; line-height: 1.375; white-space: pre-wrap; word-break: break-word; }

        .avail-vars-box { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; }
        .avail-vars-box h4 { font-size: 0.8rem; color: var(--text-bright); margin-bottom: 8px; text-transform: uppercase; }
        .var-chip { display: inline-block; background: #3a3d45; color: #58a6ff; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.75rem; margin: 2px; cursor: pointer; }
        .var-chip:hover { background: #474b55; text-decoration: underline; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 1000; }
        .modal { background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px; width: 420px; padding: 20px; }
        .modal h3 { color: var(--text-bright); margin-bottom: 15px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        
        .empty-state { display: flex; height: 100%; justify-content: center; align-items: center; color: var(--text-muted); font-size: 0.9rem; }
    </style>
</head>
<body>

    <header>
        <div class="logo-area">
            <span>🌐 Language Pack IDE</span>
        </div>
        <div class="controls">
            <label for="langSelect" style="font-size: 0.8rem;">Language:</label>
            <select id="langSelect" onchange="switchLanguage()"></select>
            <button onclick="createNewEntryModal()">+ New Entry</button>
            <button onclick="saveAll()" style="background-color: #28a745;">💾 Save Changes</button>
        </div>
    </header>

    <div class="workspace">
        <div class="sidebar">
            <div class="sidebar-header">
                <span>Explorer</span>
                <span id="entryCount">0 keys</span>
            </div>
            <div class="explorer-tree" id="explorerTree"></div>
        </div>

        <div class="editor-container">
            <div class="editor-pane" id="editorPane">
                <div class="empty-state">Select an item from the explorer tree to view and edit.</div>
            </div>

            <div class="preview-pane" id="previewPane">
                <div class="avail-vars-box">
                    <h4>Available Variables</h4>
                    <div id="availVarsList"></div>
                </div>

                <div class="section-title" style="margin-top: 10px;">
                    <span>Discord Live Preview</span>
                </div>

                <div id="discordPreview">
                    <div class="empty-state" style="height: 120px;">Select an embed or string to render preview</div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="newEntryModal">
        <div class="modal">
            <h3>Create New Language Key</h3>
            <div class="form-group">
                <label>Key Path (dot notation):</label>
                <input type="text" id="newKeyPath" placeholder="command.feature.myText">
            </div>
            <div class="form-group">
                <label>Entry Type:</label>
                <select id="newKeyType">
                    <option value="string">Primitive String</option>
                    <option value="discordEmbed">Discord Embed</option>
                    <option value="collection">Collection / Folder</option>
                </select>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button onclick="confirmCreateEntry()">Create Key</button>
            </div>
        </div>
    </div>

    <script>
        let languagesData = {};
        let currentLang = '';
        let selectedPath = null;

        window.addEventListener('DOMContentLoaded', async () => {
            await fetchLanguages();
        });

        async function fetchLanguages() {
            const res = await fetch('/api/languages');
            languagesData = await res.json();
            
            const langSelect = document.getElementById('langSelect');
            langSelect.innerHTML = '';
            
            const langs = Object.keys(languagesData);
            if (langs.length === 0) return;

            langs.forEach(lang => {
                const opt = document.createElement('option');
                opt.value = lang;
                opt.textContent = lang.toUpperCase();
                langSelect.appendChild(opt);
            });

            currentLang = langs[0];
            renderTree();
        }

        function switchLanguage() {
            currentLang = document.getElementById('langSelect').value;
            renderTree();
            if (selectedPath) loadPathEditor(selectedPath);
        }

        function getByPath(obj, path) {
            if (!path) return obj;
            return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
        }

        function setByPath(obj, path, value) {
            const keys = path.split('.');
            let current = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (!current[k] || typeof current[k] !== 'object') {
                    current[k] = {};
                }
                current = current[k];
            }
            current[keys[keys.length - 1]] = value;
        }

        function deleteByPath(obj, path) {
            const keys = path.split('.');
            let current = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
                if (!current) return;
            }
            delete current[keys[keys.length - 1]];
        }

        function getNodeType(val) {
            if (typeof val === 'string') return 'string';
            if (typeof val === 'object' && val !== null) {
                if (val.__type__) return val.__type__;
                if (val.title !== undefined || val.description !== undefined) return 'discordEmbed';
                if (val.string !== undefined) return 'string';
                return 'collection';
            }
            return 'string';
        }

        function extractVariables(obj) {
            const vars = new Set();
            const regex = /\\{([^\\}]+)\\}/g;

            const parseText = (text) => {
                if (typeof text !== 'string') return;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    vars.add(match[1]);
                }
            };

            if (typeof obj === 'string') {
                parseText(obj);
            } else if (typeof obj === 'object' && obj !== null) {
                if (obj.string) parseText(obj.string);
                if (obj.title) parseText(obj.title);
                if (obj.description) parseText(obj.description);
            }
            return Array.from(vars);
        }

        function renderTree() {
            const root = languagesData[currentLang] || {};
            const treeContainer = document.getElementById('explorerTree');
            treeContainer.innerHTML = '';
            
            let totalKeys = 0;
            
            function buildBranch(obj, parentPath = '', depth = 0) {
                const fragment = document.createDocumentFragment();
                
                for (const key in obj) {
                    if (key.startsWith('__')) continue;
                    
                    const fullPath = parentPath ? \`\${parentPath}.\${key}\` : key;
                    const val = obj[key];
                    const type = getNodeType(val);

                    totalKeys++;

                    const node = document.createElement('div');
                    node.className = 'tree-node';

                    const row = document.createElement('div');
                    row.className = \`node-row \${selectedPath === fullPath ? 'active' : ''}\`;
                    row.style.paddingLeft = \`\${depth * 16 + 12}px\`;
                    
                    const icon = document.createElement('span');
                    icon.className = 'node-icon';
                    icon.textContent = (type === 'collection') ? '📁' : (type === 'discordEmbed' ? '🖼️' : '🔤');

                    const label = document.createElement('span');
                    label.className = 'node-label';
                    label.textContent = key;

                    const badge = document.createElement('span');
                    badge.className = \`type-badge \${type === 'discordEmbed' ? 'embed' : (type === 'string' ? 'string' : '')}\`;
                    badge.textContent = type === 'discordEmbed' ? 'EMBED' : (type === 'string' ? 'STR' : 'DIR');

                    row.appendChild(icon);
                    row.appendChild(label);
                    row.appendChild(badge);
                    node.appendChild(row);

                    if (type === 'collection') {
                        const childrenContainer = document.createElement('div');
                        childrenContainer.className = 'node-children';
                        
                        row.onclick = (e) => {
                            e.stopPropagation();
                            document.querySelectorAll('.node-row').forEach(r => r.classList.remove('active'));
                            row.classList.add('active');
                            selectedPath = fullPath;
                            
                            childrenContainer.classList.toggle('open');
                            icon.textContent = childrenContainer.classList.contains('open') ? '📂' : '📁';
                            loadPathEditor(fullPath);
                        };

                        childrenContainer.appendChild(buildBranch(val, fullPath, depth + 1));
                        node.appendChild(childrenContainer);
                    } else {
                        row.onclick = (e) => {
                            e.stopPropagation();
                            document.querySelectorAll('.node-row').forEach(r => r.classList.remove('active'));
                            row.classList.add('active');
                            selectedPath = fullPath;
                            loadPathEditor(fullPath);
                        };
                    }

                    fragment.appendChild(node);
                }
                return fragment;
            }

            treeContainer.appendChild(buildBranch(root));
            document.getElementById('entryCount').textContent = \`\${totalKeys} items\`;
        }

        function loadPathEditor(pathStr) {
            const item = getByPath(languagesData[currentLang], pathStr);
            const editorPane = document.getElementById('editorPane');

            if (!item) {
                editorPane.innerHTML = '<div class="empty-state">Selected key does not exist.</div>';
                return;
            }

            const type = getNodeType(item);

            let html = \`
                <div class="section-title">
                    <span>\${pathStr}</span>
                    <button class="btn-danger" onclick="deleteEntry('\${pathStr}')">Delete</button>
                </div>
            \`;

            if (type === 'string') {
                const valStr = typeof item === 'object' ? (item.string || '') : item;
                html += \`
                    <div class="form-group">
                        <label>String Value:</label>
                        <textarea id="field_string" oninput="updateStringValue('\${pathStr}', this.value)">\${valStr}</textarea>
                    </div>
                \`;
            } else if (type === 'discordEmbed') {
                html += \`
                    <div class="form-group">
                        <label>Embed Title:</label>
                        <input type="text" id="field_title" value="\${item.title || ''}" oninput="updateEmbedField('\${pathStr}', 'title', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Embed Description:</label>
                        <textarea id="field_description" oninput="updateEmbedField('\${pathStr}', 'description', this.value)">\${item.description || ''}</textarea>
                    </div>
                \`;
            } else if (type === 'collection') {
                html += \`
                    <div class="empty-state" style="height: 150px; flex-direction: column; gap: 10px;">
                        <div>📁 Folder / Collection Object</div>
                        <button onclick="createNewEntryModal('\${pathStr}.')">+ Add New Key Inside Here</button>
                    </div>
                \`;
            }

            if (type !== 'collection') {
                const variables = (typeof item === 'object' && item.__variables__) ? item.__variables__ : {};
                html += \`
                    <div style="margin-top:25px;">
                        <div class="section-title" style="font-size: 0.95rem;">
                            <span>Variables Meta</span>
                            <div style="display: flex; gap: 6px;">
                                <button onclick="autoDetectVariables('\${pathStr}')" class="btn-secondary" style="background:#0e639c;">⚡ Auto-Detect Variables</button>
                                <button onclick="addVariableRow('\${pathStr}')" class="btn-secondary">+ Add Variable</button>
                            </div>
                        </div>
                        <table class="var-table">
                            <thead>
                                <tr>
                                    <th>Var Name</th>
                                    <th>Description</th>
                                    <th>Mock Value</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="varTableBody">
                \`;

                for (const vKey in variables) {
                    const vObj = variables[vKey];
                    html += \`
                        <tr>
                            <td><input type="text" value="\${vKey}" readonly style="color:#8ab4f8;"></td>
                            <td><input type="text" value="\${vObj.description || ''}" onchange="updateVarMeta('\${pathStr}', '\${vKey}', 'description', this.value)"></td>
                            <td><input type="text" value="\${vObj.mock || ''}" onchange="updateVarMeta('\${pathStr}', '\${vKey}', 'mock', this.value)"></td>
                            <td><button class="btn-danger" style="padding: 2px 6px;" onclick="removeVariable('\${pathStr}', '\${vKey}')">x</button></td>
                        </tr>
                    \`;
                }

                html += \`
                            </tbody>
                        </table>
                    </div>
                \`;
            }

            editorPane.innerHTML = html;
            renderPreview(pathStr);
            renderAvailableVariables(pathStr);
        }

        function autoDetectVariables(pathStr) {
            let item = getByPath(languagesData[currentLang], pathStr);
            if (!item) return;

            if (typeof item === 'string') {
                item = {
                    "__type__": "string",
                    "string": item
                };
                setByPath(languagesData[currentLang], pathStr, item);
            }

            const foundVars = extractVariables(item);
            if (foundVars.length === 0) {
                alert('No variables in {varName} format were found in this entry.');
                return;
            }

            if (!item.__variables__) item.__variables__ = {};

            let addedCount = 0;
            foundVars.forEach(v => {
                if (!item.__variables__[v]) {
                    item.__variables__[v] = {
                        description: 'Auto-detected variable',
                        mock: '[' + v + ']'
                    };
                    addedCount++;
                }
            });

            loadPathEditor(pathStr);

            if (addedCount > 0) {
                alert('Successfully added ' + addedCount + ' variable(s) to metadata.');
            } else {
                alert('All detected variables are already registered in the variables meta.');
            }
        }

        function updateStringValue(pathStr, val) {
            const current = getByPath(languagesData[currentLang], pathStr);
            if (typeof current === 'object' && current !== null) {
                current.string = val;
            } else {
                setByPath(languagesData[currentLang], pathStr, val);
            }
            renderPreview(pathStr);
        }

        function updateEmbedField(pathStr, field, val) {
            const current = getByPath(languagesData[currentLang], pathStr);
            if (typeof current === 'object') {
                current[field] = val;
            }
            renderPreview(pathStr);
        }

        function updateVarMeta(pathStr, varKey, prop, val) {
            const item = getByPath(languagesData[currentLang], pathStr);
            if (!item.__variables__) item.__variables__ = {};
            if (!item.__variables__[varKey]) item.__variables__[varKey] = {};
            item.__variables__[varKey][prop] = val;
            renderPreview(pathStr);
        }

        function addVariableRow(pathStr) {
            const vName = prompt("Enter variable name (e.g., teamId):");
            if (!vName) return;
            const item = getByPath(languagesData[currentLang], pathStr);
            if (typeof item !== 'object') return;
            if (!item.__variables__) item.__variables__ = {};
            item.__variables__[vName] = { description: "", mock: "Sample" };
            loadPathEditor(pathStr);
        }

        function removeVariable(pathStr, varKey) {
            const item = getByPath(languagesData[currentLang], pathStr);
            if (item && item.__variables__) {
                delete item.__variables__[varKey];
                loadPathEditor(pathStr);
            }
        }

        function renderPreview(pathStr) {
            const item = getByPath(languagesData[currentLang], pathStr);
            const previewContainer = document.getElementById('discordPreview');
            
            if (!item) {
                previewContainer.innerHTML = '<div class="empty-state">No active selection</div>';
                return;
            }

            const globalAutoFill = languagesData[currentLang].meta?.autoFillVariables || {};
            const nodeVariables = (typeof item === 'object' && item.__variables__) ? item.__variables__ : {};

            const mockMap = {};
            for (const k in globalAutoFill) mockMap[k] = globalAutoFill[k].mock || \`{\${k}}\`;
            for (const k in nodeVariables) mockMap[k] = nodeVariables[k].mock || \`{\${k}}\`;

            const applyPlaceholders = (str) => {
                if (!str) return '';
                return str
                    .replace(/\\{([^\\}]+)\\}/g, (_, key) => mockMap[key] !== undefined ? mockMap[key] : \`{\${key}}\`)
                    .replace(/\\n/g, '<br/>');
            };

            const type = getNodeType(item);

            if (type === 'discordEmbed') {
                const title = applyPlaceholders(item.title);
                const desc = applyPlaceholders(item.description);

                previewContainer.innerHTML = \`
                    <div class="discord-message-container">
                        <div class="discord-avatar">BOT</div>
                        <div class="discord-message-body">
                            <div class="discord-header">
                                <span class="discord-bot-name">System Bot</span>
                                <span class="discord-bot-tag">APP</span>
                                <span class="discord-timestamp">Today at 12:00 PM</span>
                            </div>
                            <div class="discord-embed-card">
                                \${title ? \`<div class="discord-embed-title">\${title}</div>\` : ''}
                                \${desc ? \`<div class="discord-embed-description">\${desc}</div>\` : ''}
                            </div>
                        </div>
                    </div>
                \`;
            } else if (type === 'string') {
                const rawStr = typeof item === 'object' ? (item.string || '') : item;
                previewContainer.innerHTML = \`
                    <div class="discord-message-container">
                        <div class="discord-avatar">BOT</div>
                        <div class="discord-message-body">
                            <div class="discord-header">
                                <span class="discord-bot-name">System Bot</span>
                                <span class="discord-bot-tag">APP</span>
                                <span class="discord-timestamp">Today at 12:00 PM</span>
                            </div>
                            <div style="font-size: 0.9rem; line-height: 1.375; color: #dbdee1; margin-top: 2px;">
                                \${applyPlaceholders(rawStr)}
                            </div>
                        </div>
                    </div>
                \`;
            } else {
                previewContainer.innerHTML = '<div class="empty-state">Folder / Collection Selected</div>';
            }
        }

        function renderAvailableVariables(pathStr) {
            const item = getByPath(languagesData[currentLang], pathStr);
            const container = document.getElementById('availVarsList');
            container.innerHTML = '';

            const globalAutoFill = languagesData[currentLang].meta?.autoFillVariables || {};
            const nodeVariables = (typeof item === 'object' && item.__variables__) ? item.__variables__ : {};

            const keys = new Set([...Object.keys(globalAutoFill), ...Object.keys(nodeVariables)]);

            if (keys.size === 0) {
                container.innerHTML = '<span style="font-size:0.75rem; color:#858585;">No variables detected</span>';
                return;
            }

            keys.forEach(k => {
                const chip = document.createElement('span');
                chip.className = 'var-chip';
                chip.textContent = \`{\${k}}\`;
                chip.onclick = () => {
                    navigator.clipboard.writeText(\`{\${k}}\`);
                    alert(\`Copied {\${k}} to clipboard!\`);
                };
                container.appendChild(chip);
            });
        }

        function createNewEntryModal(presetPath = null) {
            const pathInput = document.getElementById('newKeyPath');
            if (presetPath !== null) {
                pathInput.value = presetPath;
            } else if (selectedPath) {
                const currentObj = getByPath(languagesData[currentLang], selectedPath);
                const type = getNodeType(currentObj);
                pathInput.value = (type === 'collection') ? \`\${selectedPath}.\` : \`\${selectedPath}\`;
            } else {
                pathInput.value = '';
            }
            document.getElementById('newEntryModal').style.display = 'flex';
            pathInput.focus();
        }

        function closeModal() {
            document.getElementById('newEntryModal').style.display = 'none';
        }

        function confirmCreateEntry() {
            const keyPath = document.getElementById('newKeyPath').value.trim();
            const keyType = document.getElementById('newKeyType').value;

            if (!keyPath) return alert('Key path is required');

            let payload;
            if (keyType === 'string') {
                payload = { "__type__": "string", "string": "New String Value" };
            } else if (keyType === 'discordEmbed') {
                payload = { "__type__": "discordEmbed", "title": "New Title", "description": "New Description" };
            } else {
                payload = { "__type__": "collection" };
            }

            setByPath(languagesData[currentLang], keyPath, payload);
            closeModal();
            renderTree();
            selectedPath = keyPath;
            loadPathEditor(keyPath);
        }

        function deleteEntry(pathStr) {
            if (confirm(\`Are you sure you want to delete "\${pathStr}"?\`)) {
                deleteByPath(languagesData[currentLang], pathStr);
                selectedPath = null;
                renderTree();
                document.getElementById('editorPane').innerHTML = '<div class="empty-state">Select an item from the explorer tree to view and edit.</div>';
                document.getElementById('discordPreview').innerHTML = '';
            }
        }

        async function saveAll() {
            const res = await fetch('/api/languages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(languagesData)
            });
            
            if (res.ok) {
                alert('All Language Files Saved Successfully! 🚀');
            } else {
                alert('Failed to save language files.');
            }
        }
    </script>
</body>
</html>
    `;
}

const server = http.createServer((req, res) => {
    try {
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(generateHtml());
        } 
        else if (req.method === 'GET' && req.url === '/api/languages') {
            const data = loadAllLanguageData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } 
        else if (req.method === 'POST' && req.url === '/api/languages') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                const payload = JSON.parse(body);
                for (const langName in payload) {
                    const filePath = path.join(LANGUAGE_DIR, `${langName}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(payload[langName], null, 4), 'utf8');
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            });
        } 
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error: ' + err.message);
    }
});

server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`[Language Editor] IDE is active at http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});

const quit = () => {
    console.log('\n[Language Editor] Shutting down server...');
    process.exit(0);
};

process.on('SIGINT', quit);
process.on('SIGTERM', quit);