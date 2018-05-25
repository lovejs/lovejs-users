const _ = require("lodash");

class UserExtractor {
    constructor(repository, token_provider, token_extractor) {
        this.repository = repository;
        this.token_provider = token_provider;
        this.token_extractor = token_extractor;
    }

    async getUser(request) {
        const token = this.token_extractor.extractToken(request);
        if (!token) {
            return false;
        }

        const userId = await this.token_provider.getUser(token);

        if (!userId) {
            return false;
        }

        return await this.repository.getUser(userId);
    }
}

module.exports = UserExtractor;
