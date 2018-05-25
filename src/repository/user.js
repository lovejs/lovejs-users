var _ = require("lodash");

class UserRepository {
    constructor(model, profileModel, email_normalizer, password_encoder) {
        this.model = model;
        this.profileModel = profileModel;
        this.email_normalizer = email_normalizer;
        this.password_encoder = password_encoder;

        this.model.addHook("beforeValidate", "hash-password", this.hookHashPassword.bind(this));
        this.model.addHook("beforeValidate", "normalize-email", this.hookNormalizeEmail.bind(this));
        this.registerHooks();
    }

    registerHooks() {}

    async hookHashPassword(user, options) {
        if (user.get("plain_password")) {
            user.setDataValue("password", await this.password_encoder.hash(user.get("plain_password")));
        }
    }

    async hookNormalizeEmail(user, options) {
        if (user.changed("email")) {
            let email = user
                .get("email")
                .trim()
                .toLowerCase();
            user.setDataValue("email", email);
            user.setDataValue("email_canonical", this.email_normalizer.normalize(email));
        }
    }

    getWhere(properties) {
        if (properties.email) {
            properties.email_canonical = this.email_normalizer.normalize(properties.email);
            delete properties.email;
        }

        return { where: { ...properties } };
    }

    /**
     * Retrieve a user by property or id
     */
    async getUser(properties) {
        if (!properties) {
            return null;
        }

        if (_.isPlainObject(properties)) {
            return this.model.findOne(this.getWhere(properties));
        } else {
            return this.model.findById(properties);
        }
    }

    /**
     * Check if user exists given properties
     */
    async getExists(properties) {
        return (await this.model.count(this.getWhere(properties))) > 0;
    }

    /**
     * Create a user instance
     *
     * @return user
     */
    create(data = {}) {
        let include = [];
        if (this.profileModel) {
            include.push(this.profileModel);
        }
        return this.model.build(data, { include });
    }
}

module.exports = UserRepository;
