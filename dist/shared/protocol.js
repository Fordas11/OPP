/** Adapter pattern: isolates JSON transport details from game classes. */
export class JsonProtocolAdapter {
    encode(message) { return JSON.stringify(message); }
    decode(payload) {
        const value = JSON.parse(payload);
        if (!value || typeof value !== 'object' || !('type' in value))
            throw new Error('Invalid game message.');
        return value;
    }
}
