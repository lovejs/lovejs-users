class PasswordEncoderPlain {
    async hash(password) {
        return password;
    }

    async compare(password, hash) {
        return password === hash;
    }
}

module.exports = PasswordEncoderPlain;
