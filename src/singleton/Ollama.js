const Constants = require('./../../data/constants');

class Ollama {
    static URL = process.env.OLLAMA_URL;

    static get AI_MODELS() {
        return {
            get LLAMA() {
                return {
                    get V_3_2() {
                        return 'llama3.2';
                    }
                }
            },
        }
    }

    static async request(prompt = null, model = this.AI_MODELS.LLAMA.V_3_2) {
        if (prompt == null) {
            console.log('[Ollama] no prompt defined', Constants.CONSOLE.ERROR);
            return null;
        }

        try {
            console.log('[Ollama] New Prompt', Constants.CONSOLE.WORKING);

            const response = await fetch(this.SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('[Ollama] New Prompt finished', Constants.CONSOLE.GOOD);

            const data = await response.json();
            return data.response;

        } catch (error) {
            console.error('[Ollama] Request failed:', error);
            return null;
        }
    }
}

module.exports = Ollama;