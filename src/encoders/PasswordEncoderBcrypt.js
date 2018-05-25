const bcrypt = require("bcrypt");

class PasswordEncoderBcrypt {
    constructor(saltRounds = 8) {
        this.saltRounds = saltRounds;
    }

    async hash(password) {
        return bcrypt.hash(password, this.saltRounds);
    }

    async compare(password, hash) {
        return bcrypt.compare(password, hash);
    }
}

module.exports = PasswordEncoderBcrypt;
