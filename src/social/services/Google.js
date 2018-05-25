var Promise = require("bluebird");

class Google {
    constructor(settings) {
        this.settings = settings;
    }

    async getCurrentUser(token) {
        return new Promise((resolve, reject) => {
            var verifier = require("google-id-token-verifier");
            var clientId = this.settings.get("google.tokenVerifierClientId");

            console.log("Attempt to verify token with : ", clientId, " & ", token);

            verifier.verify(token, clientId, function(err, tokenInfo) {
                console.log("Token info are: ", tokenInfo);

                if (!err) {
                    return resolve({ data: tokenInfo, token: "temp" });
                }

                reject(err);
            });
        });
    }

    async getProfile(access_token, fields = false) {
        const user = await this.getCurrentUser(access_token, fields);

        return {
            id: user.id,
            token: user.access_token,
            email: user.email,
            image: _.get(user, "cover.source"),
            name: user.name,
            first_name: user.first_name,
            last_name: user.last_name,
            gender: user.gender == "female" ? "F" : "M"
        };
    }
}

module.exports = Google;
