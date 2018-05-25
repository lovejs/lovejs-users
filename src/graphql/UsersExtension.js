const _ = require("lodash");
const { GraphExtension } = require("@lovejs/graphql/src/graphql");

const Endless = new Proxy(
    {},
    {
        get(target, prop) {
            return () => Endless;
        }
    }
);

class UsersExtension extends GraphExtension {
    constructor(manager, configuration) {
        super();
        this.manager = manager;
        this.configuration = configuration;
    }

    isEnabled(name, type = "mutation") {
        let key;
        switch (type) {
            case "mutation":
                key = "mutations";
                break;
            case "query":
                key = "query";
                break;
        }
        return this.configuration[key].includes(name);
    }

    addQuery(name) {
        return this.configuration.queries.includes(name) ? super.addQuery(name) : Endless;
    }

    addMutation(name) {
        return this.configuration.mutations.includes(name) ? super.addMutation(name) : Endless;
    }

    registerObjects() {
        this.registerTypes();
        this.registerQueries();
        this.registerMutations();
    }

    registerTypes() {
        this.addType("CurrentUser").properties({
            id: "ID!",
            authed: "Boolean!",
            token: "String",
            username: "String",
            email: "String",
            email_update: "String",
            ...(this.configuration.profile ? { profile: "Profile" } : {})
        });

        if (this.configuration.social) {
            this.addType("SocialConnect").properties({
                service: "String!",
                linked: "Boolean!",
                authed: "Boolean!",
                created: "Boolean!",
                error: "String",
                user: "CurrentUser"
            });
        }
    }

    registerQueries() {
        this.addQuery("currentUser")
            .output("CurrentUser")
            .resolver(this.resolveCurrentUser.bind(this));

        this.addQuery("emailExists")
            .input({ email: "String!" })
            .output("Boolean")
            .resolver(this.resolveEmailExists.bind(this));

        this.addQuery("isForgotTokenValid")
            .input({ token: "String!" })
            .output("Boolean")
            .resolver(this.resolveIsForgotTokenValid.bind(this));
    }

    registerMutations() {
        //const { inputs, validation } = this.registerConfig;

        this.addMutation("register")
            //.input(inputs)
            //.middlewares({ validation })
            .output("CurrentUser")
            .resolver(this.resolveRegister.bind(this));

        this.addMutation("validate")
            .input({ token: "String!" })
            .output("CurrentUser")
            .resolver(this.resolveValidate.bind(this));

        this.addMutation("login")
            .input({ email: "String!", password: "String!" })
            .resolver(this.resolveLogin.bind(this))
            .output("CurrentUser");

        this.addMutation("social")
            .input({ service: "String!", access_token: "String!" })
            .resolver(this.resolveSocial.bind(this))
            .output("SocialConnect");

        this.addMutation("forgot")
            .input({ email: "String!" })
            .resolver(this.resolveForgot.bind(this))
            .output("Boolean");

        this.addMutation("reset")
            .input({ token: "String!", password: "String!" })
            .resolver(this.resolveReset.bind(this))
            .output("Boolean");

        this.addMutation("logout")
            .output("Boolean")
            .resolver(this.resolveLogout.bind(this));

        this.addMutation("updatePassword")
            .output("Boolean")
            .input({ password_old: "String!", password_new: "String!" })
            .resolver(this.resolveUpdatePassword.bind(this));

        this.addMutation("updateEmail")
            .output("Boolean")
            .input({ email: "String!" })
            .resolver(this.resolveUpdateEmail.bind(this));
    }

    async currentUser(user = false, token = false) {
        let data = user && user.get ? user.get() : {};
        if (token) {
            data.token = token;
        }

        let profile = {};

        if (user && this.configuration.profile && user.getProfile) {
            profile = { profile: await user.getProfile() };
        }

        return {
            id: "current",
            authed: user ? true : false,
            ...data,
            ...profile
        };
    }

    async connectUser(user) {
        const token = await this.manager.signIn(user);
        console.log("token = ", token);
        return await this.currentUser(user, token);
    }

    /********************************
     ***         REGISTER         ***
     ********************************/
    async resolveRegister(_, { input }, context) {
        const user = await this.manager.register(input);
        if (user) {
            return this.connectUser(user);
        }
    }

    async resolveValidate(_, { token }, context) {
        return this.manager.validate(token);
    }

    async resolveEmailExists(_, { email }, context) {
        return await this.manager.getEmailExists(email);
    }

    /********************************
     *** LOGIN / LOGOUT / CURRENT ***
     ********************************/
    async resolveLogin(_, { email, password }, context) {
        const user = await this.manager.authenticate(email, password);
        if (user) {
            return this.connectUser(user);
        }
        return new Error("Invalid credentials");
    }

    async resolveLogout(_, {}, context) {
        return true;
    }

    async resolveCurrentUser(_, {}, { getUser }) {
        const user = await getUser();
        return await this.currentUser(user);
    }

    /********************************
     ****      SOCIAL STUFF      ****
     ********************************/
    async resolveSocial(_, { service, access_token }, { getUser }) {
        const { user, status, ...info } = await this.manager.social(await getUser(), service, access_token);

        const s = this.manager.getSocialStatus();
        let res = {
            service,
            linked: false,
            authed: false,
            created: false
        };

        if (status.includes(s.AUTHED)) {
            res.authed = true;
            res.user = await this.connectUser(user);
        }

        if (status.includes(s.CREATED)) {
            res.created = true;
        }

        if (status.includes(s.LINKED)) {
            res.linked = true;
        }

        if (status.includes(s.INVALID)) {
            res.error = "Social account already in use. Disconnect it before linking a new one.";
        }

        return res;
    }

    /********************************
     **** FORGOT AND RESET STUFF ****
     ********************************/
    async resolveForgot(_, { email }, context) {
        const found = await this.manager.forgot(email);
        if (found) {
            return true;
        }
        throw new Error("User not found");
    }

    async resolveReset(_, { token, password }, context) {
        return this.manager.reset(token, password);
    }

    async resolveIsForgotTokenValid(_, { token }) {
        return this.manager.isForgotTokenValid(token);
    }

    /********************************
     ****     ACCOUNT RELATED    ****
     ********************************/
    async resolveUpdatePassword(_, { password_old, password_new }, context) {
        return this.manager.updatePassword(context.getUser(), password_old, password_new);
    }

    async resolveUpdateEmail(_, { email }, context) {
        return this.manager.updateEmail(context.getUser(), email);
    }
}

module.exports = UsersExtension;
