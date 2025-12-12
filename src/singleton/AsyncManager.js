const Constants = require("../../data/constants");

class AsyncManager {
    static #actions = {};

    /**
     * Generates a unique ID for async actions.
     * @returns {string} A unique identifier.
     */
    static generateId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1_000_000);
        return `${timestamp}-${random}`;
    }

    /**
     * Adds a new async action and returns when the action has been executed.
     * @param {string} id - The unique ID for the action.
     * @param {number|null} timeout - Timeout in milliseconds (null for no timeout).
     * @param {string|null} reference - Optional reference to group actions.
     * @param {boolean} referenceKill - Whether to kill actions with the same reference.
     * @returns {Promise} A promise that resolves based on the action's outcome.
     */
    static awaitAsyncAction(id, timeout = null, reference = null, referenceKill = false) {
        if (this.#actions[id]) {
            console.log(`[AsyncManager] Action with ID "${id}" already exists`, Constants.CONSOLE.ERROR);
            throw new Error(`Action with ID "${id}" already exists.`);
        }

        return new Promise((resolve) => {
            if (referenceKill) {
                this.killAllReferences(reference);
            }

            let timeoutFunction = null;

            if (timeout !== null) {
                timeoutFunction = setTimeout(() => {
                    delete this.#actions[id];
                    resolve(false);
                }, timeout);
            }

            this.#actions[id] = {
                resolver: resolve,
                timeoutFunction,
                reference,
            };
        });
    }

    /**
     * Resolves an action by its ID.
     * @param {string} id - The unique ID of the action to resolve.
     * @param {*} data - The data to resolve the action with.
     * @param {string|null} removeReference - Optional reference to kill related actions.
     */
    static resolveAction(id, data, removeReference = null) {
        const action = this.#actions[id];

        if (!action) {
            console.log(`[AsyncManager] No action found with ID "${id}"`, Constants.CONSOLE.ERROR);
            return;
        }

        const { timeoutFunction, resolver } = action;

        if (timeoutFunction) {
            clearTimeout(timeoutFunction);
        }

        resolver(data);
        delete this.#actions[id];

        if (removeReference) {
            this.killAllReferences(removeReference);
        }
    }

    /**
     * Kills all actions associated with a specific reference.
     * @param {string} reference - The reference to search for.
     */
    static killAllReferences(reference) {
        if (!reference) return;

        for (const [id, action] of Object.entries(this.#actions)) {
            if (action.reference === reference) {
                action.resolver(null);
                delete this.#actions[id];
            }
        }
    }

    /**
     * Returns the current state of all actions for debugging or monitoring.
     * @returns {Object} The actions currently managed by the class.
     */
    static getActions() {
        return { ...this.#actions };
    }
};

module.exports = AsyncManager;