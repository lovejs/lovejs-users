const crypto = require("crypto");
const ms = require("ms");
const _ = require("lodash");
const generatePassword = require("password-generator");
const UserError = require("./errors/UserError");

const generateToken = async () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(20, (err, buff) => {
            return err ? reject(err) : resolve(buff.toString("hex"));
        });
    });
};

const socialStatus = Object.freeze({
    AUTHED: Symbol("Social status authed"),
    LINKED: Symbol("Social status linked"),
    CREATED: Symbol("Social status created"),
    INVALID: Symbol("Social status invalid")
});

const events = require("./events/users");

const tokenForgot = token => `forgot:${token}`;

class UserManager {
    constructor(repository, encoder, token_provider, social_manager, emitter, cache, options) {
        this.repository = repository;
        this.encoder = encoder;
        this.provider = token_provider;
        this.cache = cache;
        this.social_manager = social_manager;
        this.emitter = emitter;
        this.options = _.defaults(options, {
            forgotExpiration: ms("12h")
        });
    }

    getSocialStatus() {
        return socialStatus;
    }

    async getEmailExists(email) {
        return await this.repository.getExists({ email });
    }

    async updateLocale(user, locale) {
        user.set("locale", locale);

        return await user.save();
    }

    /**
     * Register a user
     */
    async register(data) {}

    /**
     * Authenticate user with username/email and password
     *
     * @return user
     */
    async authenticate(email, password) {
        const user = await this.repository.getUser({ email });
        if (!user) {
            throw new UserError("authenticate", "user_not_found");
        }

        if (!(await this.encoder.compare(password, user.get("password")))) {
            throw new UserError("authenticate", "invalid_credentials");
        }

        await this.emit(events.LOGIN, { user });
        return user;
    }

    /**
     * Sign In user and get token
     */
    async signIn(user) {
        return this.provider.getToken(user.get("id"));
    }

    /**
     * Check if forgot token is valid
     */
    async isForgotTokenValid(token) {
        return (await this.cache.get(tokenForgot(token))) ? true : false;
    }

    /**
     * Generate Confirm email token
     */
    async confirm(user) {
        const token = await generateToken();
        user.set("token_confirm", token);
        await user.save();
        await this.emit(events.CONFIRM, { user, token });

        return true;
    }

    /**
     * Validate a user email
     */
    async validate(token) {
        const user = await this.repository.getUser({ token_confirm: token });

        if (!user) {
            throw new UserError("validate", "user_not_found");
        }

        user.set({
            time_confirmed: new Date(),
            token_confirm: null
        });
        await user.save();
        await this.emit(events.VALIDATE, { user, token });

        return user;
    }

    /**
     * Handle user ask forgot - GENERATE forgot token
     */
    async forgot(email) {
        const user = await this.repository.getUser({ email });
        if (!user) {
            throw new UserError("forgot", "user_not_found");
        }

        const token = await generateToken();
        await this.cache.set(tokenForgot(token), user.get("id"), this.options.forgotExpiration);
        await this.emit(events.FORGOT, { user, email, token });
    }

    /**
     * Handle user reset password from forgot token
     */
    async reset(token, password) {
        const tokenKey = tokenForgot(token);
        const userId = await this.cache.get(tokenKey);
        if (!userId) {
            throw new UserError("reset", "token_expired");
        }

        const user = await this.repository.getUser(userId);
        if (!user) {
            throw new UserError("reset", "user_not_found");
        }

        user.set({
            time_password_update: new Date(),
            plain_password: password
        });
        await user.save();
        await this.emit(events.RESET, { user, password, token });
        await this.cache.delete(tokenKey);

        return user;
    }

    /************************************
     ******** PASSWORD UPDATING *********
     ************************************/

    /**
     * Handle password update for a user
     */
    async updatePassword(user, oldPassword, newPassword) {
        if (!(await this.encoder.compare(oldPassword, user.get("password")))) {
            throw new UserError("update_password", "password_mismatch");
        }

        user.set({
            plain_password: newPassword,
            time_password_update: new Date()
        });
        await user.save();
        await this.emit(events.UPDATE_PASSWORD, { user, password: newPassword });
    }

    /************************************
     ********** EMAIL UPDATING **********
     ************************************/

    /**
     * Handle email update for user
     */
    async updateEmail(user, email) {
        if (await this.repository.getExists({ email })) {
            throw new UserError("update_email", "email_exists");
        }
        const token = await generateToken();
        user.set({
            email_update: email,
            token_update: token
        });

        await user.save();
        await this.emit(events.UPDATE_EMAIL, { user, email, token });

        return user;
    }

    /**
     * Handle email update cancel
     */
    async updateEmailCancel(user) {
        user.set({
            email_update: null,
            token_update: null
        });

        await user.save();
        await this.emit(events.UPDATE_EMAIL_CANCEL, { user });

        return user;
    }

    /**
     * Handle email update resend
     */
    async updateEmailResend(user) {
        if (!user.get("email_update")) {
            throw new UserError("update_email_resend", "email_update_missing");
        }

        await this.emit(events.UPDATE_EMAIL_RESEND, { user, token: user.get("token_update") });

        return user;
    }

    /**
     * Handle email update validation
     */
    async updateEmailValidate(token) {
        const user = await this.repository.getUser({ token_update: token });
        if (!user) {
            throw new UserError("update_email_validate", "user_not_found");
        }

        const newEmail = user.get("email_update");

        if (await this.repository.getEmailExists(email)) {
            throw new UserError("update_email_validate", "email_exists");
        }

        user.set({
            email: newEmail,
            email_update: null,
            token_update: null
        });

        await user.save();
        await this.emit(events.UPDATE_EMAIL_VALIDATE, { user });

        return user;
    }

    /**
     * Given a service and a token
     */
    async social(currentUser, service, token) {
        const profile = await this.social_manager.getProfile(service, token);

        const serviceFieldId = `${service}_id`;
        const serviceFieldToken = `${service}_token`;

        if (currentUser) {
            if (currentUser.get(serviceFieldId)) {
                return { user: currentUser, status: currentUser.get(serviceFieldId) == profile.id ? [] : [socialStatus.INVALID] };
            } else {
                currentUser.set(serviceFieldId, profile.id);
                currentUser.set(serviceFieldToken, profile.token);
                await currentUser.save();

                return { user: currentUser, status: [socialStatus.LINKED] };
            }
        } else {
            let eventSocial = events.SOCIAL.AUTHED;
            let eventData = {};

            let s = [socialStatus.AUTHED];
            let user = await this.repository.getUser({ [serviceFieldId]: profile.id });

            if (!user) {
                user = await this.repository.getUser({ email: profile.email });
                s.push(socialStatus.LINKED);
                eventSocial = events.SOCIAL.LINKED;
            }

            if (!user) {
                s.push(socialStatus.CREATED);
                const password = generatePassword(10, false);
                eventData.password = password;
                user = this.repository.create({
                    plain_password: password,
                    email: profile.email,
                    time_confirmed: new Date(),
                    locale: profile.locale,
                    profile: {
                        name: profile.name,
                        gender: profile.gender
                    }
                });
                eventSocial = events.SOCIAL.REGISTER;
            }

            user.set(serviceFieldId, profile.id);
            user.set(serviceFieldToken, profile.token);
            await user.save();
            await this.emit(eventSocial, { user, service, ...eventData });
            return { user, status: s };
        }
    }

    async emit(event, data) {
        return await this.emitter.emit(event, data);
    }
}

module.exports = UserManager;
