// Use the native DOMException provided by Node.js global environment
module.exports = globalThis.DOMException || class DOMException extends Error {
  constructor(message, name) {
    super(message);
    this.name = name || "DOMException";
  }
};
