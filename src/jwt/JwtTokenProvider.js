var jwt = require("jsonwebtoken");

class JwtTokenProvider {
    constructor(options) {
        this.secret = options.secretOrKey;
        this.options = {
            sign: {},
            verify: {}
        };
    }

    async getToken(userIdentifier) {
        return await this.sign({ user: userIdentifier });
    }

    async getUser(token) {
        const decoded = await this.verify(token);
        if (!decoded) {
            return false;
        } else {
            return decoded.user;
        }
    }

    async sign(payload) {
        return new Promise((resolve, reject) => {
            jwt.sign(payload, this.secret, this.options.sign, (err, token) => {
                return err ? reject(err) : resolve(token);
            });
        });
    }

    async verify(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.secret, this.options.verify, (err, decoded) => {
                return err ? reject(err) : resolve(decoded);
            });
        });
    }
}

module.exports = JwtTokenProvider;
