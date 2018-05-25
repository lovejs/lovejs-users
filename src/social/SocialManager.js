class SocialManager {
    constructor(services) {
        this.services = services;
    }

    getService(service) {
        if (!this.services[service]) {
            throw new Error(`Unknow social service ${service}`);
        }

        return this.services[service];
    }

    getStatus() {
        return status;
    }

    async getProfile(service, token) {
        return await this.getService(service).getProfile(token);
    }
}

module.exports = SocialManager;
