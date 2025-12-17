const http = require('http');
const path = require('path');
const fs = require('fs');

const LANGUAGE_DIR = path.join(__dirname, 'languages');
const PORT = 3000;

/**
 * Recursively flattens a nested JSON object into a list of key-value pairs
 * where the key is the full path (e.g., "debug.mongo-left-users.title").
 * @param {object} obj - The JSON object.
 * @param {string} prefix - The current key prefix.
 * @returns {Array<{fullKey: string, value: string, isObject: boolean}>}
 */
function flattenJson(obj, prefix = '') {
    let result = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result = result.concat(flattenJson(value, fullKey));
            } else {
                result.push({
                    fullKey: fullKey,
                    value: String(value),
                    isObject: false
                });
            }
        }
    }
    return result;
};

function unflattenAndSet(obj, fullKey, value) {
    const keys = fullKey.split('.');
    let current = obj;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (i === keys.length - 1) {
            current[key] = value;
        } else {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
    }
};

/**
 * Loads all language files from the directory.
 * @returns {object} - Object where keys are language names (e.g., 'english') and values are the flattened JSON data.
 */
function loadLanguageData() {
    try {
        const files = fs.readdirSync(LANGUAGE_DIR).filter(file => file.endsWith('.json'));
        const data = {};
        for (const file of files) {
            const langName = path.basename(file, '.json');
            const filePath = path.join(LANGUAGE_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);
            data[langName] = flattenJson(json);
        }
        return data;
    } catch (error) {
        console.error(`Error loading language data from ${LANGUAGE_DIR}:`, error.message);
        return {};
    }
};

function generateHtml(data) {
    const languageNames = Object.keys(data);
    const firstLangData = data[languageNames[0]] || [];

    let tableRows = '';

    for (const item of firstLangData) {
        const fullKey = item.fullKey;

        const isSpecial = fullKey.includes('_') || fullKey.includes('#');
        const rowClass = isSpecial ? 'class="special-key"' : '';

        tableRows += `<tr ${rowClass}><td>${fullKey}</td>`;

        for (const langName of languageNames) {
            const langItem = data[langName].find(d => d.fullKey === fullKey);
            const inputName = `${langName}__${fullKey}`;

            if (langItem) {
                tableRows += `
                    <td>
                        <textarea 
                            name="${inputName}" 
                            rows="1" 
                            data-lang="${langName}" 
                            data-key="${fullKey}"
                        >${langItem.value}</textarea>
                    </td>`;
            } else {
                tableRows += `
                    <td>
                        <button type="button" 
                            style="background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em; padding: 5px 10px;"
                            onclick="const t = document.createElement('textarea'); 
                                     t.name='${inputName}'; t.rows=1; t.textContent=''; 
                                     this.parentElement.appendChild(t); this.remove();">
                            + Create Key
                        </button>
                    </td>`;
            }
        }
        tableRows += '</tr>';
    }

    const tableHeaders = languageNames.map(lang => `<th>${lang.toUpperCase()}</th>`).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Language Editor</title>
            <style>
                /* --- DARK MODE STYLES (Retained) --- */
                body { 
                    font-family: sans-serif; 
                    margin: 20px; 
                    background-color: #1e1e1e; /* Dark background */
                    color: #e0e0e0; /* Light text color */
                }
                h1 { 
                    color: #007bff; /* Keep a bright header color */
                }
                form { 
                    background: #252526; /* Slightly lighter dark background for the form container */
                    padding: 20px; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5); /* Stronger shadow for depth */
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                }
                th, td { 
                    padding: 8px 12px; 
                    border: 1px solid #444; /* Darker border */
                    text-align: left; 
                    vertical-align: top; 
                }
                th { 
                    background-color: #007bff; 
                    color: white; 
                    position: sticky; 
                    top: 0; 
                }
                tr:nth-child(even) { 
                    background-color: #2c2c2c; /* Striped rows for readability */
                }
                td {
                    background-color: #1e1e1e; /* Default row color */
                }
                td:first-child { 
                    font-family: monospace; 
                    font-size: 0.9em; 
                    background-color: #333; /* Darker background for key path column */
                    color: #f0f0f0;
                }
                textarea { 
                    width: 100%; 
                    min-height: 20px; /* IMPORTANT: Min height is crucial */
                    box-sizing: border-box; 
                    resize: vertical; 
                    border: 1px solid #555; 
                    padding: 5px; 
                    background-color: #3a3a3a; 
                    color: #e0e0e0;
                    overflow-y: hidden; /* Hide scrollbar for seamless resizing */
                }
                button { 
                    padding: 10px 20px; 
                    background-color: #28a745; 
                    color: white; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer; 
                    margin-top: 10px; 
                    font-size: 1.1em; 
                }
                button:hover { 
                    background-color: #218838; 
                }
                .success { 
                    background-color: #1a3c22; 
                    color: #6ee69e; 
                    border: 1px solid #3c6e4e; 
                    padding: 10px; 
                    border-radius: 5px; 
                    margin-bottom: 15px; 
                }

                tr.special-key {
                   background-color: #4b0082 !important; /* Indigo/Purple background */
                }
                tr.special-key td {
                    background-color: transparent !important; /* Let the row color show through */
                }
                tr.special-key td:first-child {
                    color: #ffcc00; /* Optional: Make the key path text pop in purple rows */
                }
            </style>
            <script>
                
                // Function to set the textarea height based on its content
                const autoResizeTextarea = (element) => {
                    element.style.height = 'auto'; // Reset height to recalculate
                    // Set height to scrollHeight (content height)
                    element.style.height = element.scrollHeight + 'px';
                };

                // Auto-adjust textarea height on input (user typing)
                document.addEventListener('input', (event) => {
                    if (event.target.tagName.toLowerCase() === 'textarea') {
                        autoResizeTextarea(event.target);
                    }
                });

                // Run on page load to set initial size for all textareas
                window.addEventListener('load', () => {
                    document.querySelectorAll('textarea').forEach(autoResizeTextarea);

                    // Display success message on save (from previous update)
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('saved') === 'true') {
                        const message = document.createElement('div');
                        message.className = 'success';
                        message.textContent = 'Languages saved successfully! 🎉';
                        document.body.insertBefore(message, document.body.firstChild.nextSibling);

                        setTimeout(() => {
                            window.history.replaceState({}, document.title, window.location.pathname);
                        }, 2000);
                    }
                });
            </script>
        </head>
        <body>
            <h1>Language Translation Editor</h1>
            <form method="POST">
                <button type="submit">Save All Changes</button>
                <table>
                    <thead>
                        <tr>
                            <th>Key Path</th>
                            ${tableHeaders}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <button type="submit">Save All Changes</button>
            </form>
        </body>
        </html>
    `;
};

const server = http.createServer((req, res) => {
    try {
        if (req.method === 'GET' && req.url.startsWith('/')) {
            const languageData = loadLanguageData();
            const html = generateHtml(languageData);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);

        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                const params = new URLSearchParams(body);
                const updatedLanguages = {};

                const languageFiles = fs.readdirSync(LANGUAGE_DIR).filter(file => file.endsWith('.json'));

                languageFiles.forEach(file => {
                    const langName = path.basename(file, '.json');
                    const filePath = path.join(LANGUAGE_DIR, file);
                    const originalJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    updatedLanguages[langName] = originalJson;
                });

                for (const [key, value] of params.entries()) {
                    const [langName, fullKey] = key.split('__', 2);

                    if (langName && fullKey && updatedLanguages[langName]) {

                        let cleanValue = String(value).replace(/\r/g, '');

                        unflattenAndSet(updatedLanguages[langName], fullKey, cleanValue);
                    }
                }

                for (const langName in updatedLanguages) {
                    const filePath = path.join(LANGUAGE_DIR, `${langName}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(updatedLanguages[langName], null, 4));
                }

                res.writeHead(302, { 'Location': '/?saved=true' });
                res.end();
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error: ' + error.message);
    }
});

server.listen(PORT, () => {
    console.log(`\n✅ Language Editor running at http://localhost:${PORT}`);
    console.log(`Edit your language files in the browser and save!`);
});