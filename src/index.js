const _ = require("lodash");
const {
    di: {
        helpers: { _service }
    }
} = require("@lovejs/components");
const { Plugin } = require("@lovejs/framework");

const ms = require("ms");

class UsersPlugin extends Plugin {
    async registerServices(container, origin) {
        let social,
            modelProfile,
            serviceProfile = false;

        const hasProfile = this.get("profile");
        const hasSocial = this.get("social");

        if (hasSocial) {
            const includedServices = ["facebook", "google"];
            const services = _.keys(this.get("social"));
            social = services;

            for (let service of services) {
                container.setParameter(`users.social.${service}.options`, this.get(`social.${service}`));
                if (includedServices.includes(service)) {
                    await container.loadDefinitions(this.getPluginDir(`/_framework/services/social/${service}.yml`), origin);
                }
            }
            await container.loadDefinitions(this.getPluginDir("/_framework/services/social.yml"), origin);
        }

        if (hasProfile) {
            modelProfile = this.get("profile.model");
            serviceProfile = this.get("profile.service", `model:${modelProfile}`);
        }

        container.setParameter("users.model.database", this.get("database", "default"));
        container.setParameter("users.model.configuration", { social, modelProfile });
        container.setParameter("users.cache_service", this.get("cache_service", "cache"));

        let managerOptions = {
            forgotExpiration: ms(this.get("forgot.expiration", "12h")),
            confirmExpiration: ms(this.get("confirmation.expiration", "12h"))
        };

        container.setParameter("managers.user.options", managerOptions);
        container.setParameter("users.token.extractor.options", this.get("token_extractor", {}));

        await container.loadDefinitions(this.getPluginDir("/_framework/services/services.yml"), origin);
        await container.loadDefinitions(this.getPluginDir("/_framework/services/middlewares.yml"), origin);
        await container.loadDefinitions(this.getPluginDir("/_framework/services/context.yml"), origin);

        const passwordEncoder = this.get("password_encoder", "bcrypt");
        container.setParameter("users.manager.password.encoder", `users.password.encoder.${passwordEncoder}`);

        // Give the profile service to the user repository
        if (hasProfile) {
            container
                .getService("repository:user")
                .getArgs()
                .replaceArg(1, _service(serviceProfile));
        }

        if (hasSocial) {
            container
                .getService("users.manager")
                .getArgs()
                .replaceArg(3, _service("users.social.manager"));
        }

        // GraphQL Extension
        if (this.get("graphql")) {
            container.setParameter("users.graphql.configuration", {
                prefix: this.get("graphql.prefix"),
                types: _.difference(this.get("graphql.types.enable"), this.get("graphql.types.disable")),
                queries: _.difference(this.get("graphql.queries.enable"), this.get("graphql.queries.disable")),
                mutations: _.difference(this.get("graphql.mutations.enable"), this.get("graphql.mutations.disable")),
                register: this.get("register"),
                social: this.get("social"),
                profile: this.get("profile")
            });

            /*
            container.setParameter(
                "graphql.register.validation",
                _.get(this.config, "graphql.register.validation", {
                    username: { pattern: "[a-zA-Z0-9]{6,}" },
                    email: { format: "email" },
                    password: { minLength: 6 }
                })
            );
            */

            await container.loadDefinitions(this.getPluginDir("/_framework/services/graphql.yml"), origin);
        }

        // JWT Token Provider
        if (this.get("jwt")) {
            container.setParameter("users.jwt.options", this.get("jwt"));
            await container.loadDefinitions(this.getPluginDir("/_framework/services/jwt.yml"), origin);
        }
    }
}

module.exports = UsersPlugin;
