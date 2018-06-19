module.exports = {
    type: "object",
    properties: {
        profile: {
            type: "object",
            title: "Profile model configuration",
            additionalProperties: false,
            properties: {
                model: { type: "string", default: "profile" },
                service: { type: "string", default: "model:profile" },
                graphql_type: { type: "string", default: "Profile" }
            }
        },
        register: {
            type: "object",
            additionalProperties: false,
            properties: {
                graphql_inputs: {
                    type: "object",
                    default: {
                        username: "String!",
                        email: "String!",
                        password: "String!"
                    }
                }
            }
        },
        graphql: {
            type: "object",
            additionalProperties: false,
            properties: {
                prefix: { type: "string", default: "User_" },
                types: {
                    type: "object",
                    default: {
                        enable: ["Error", "CurrentUser", "SocialConnect"],
                        disable: []
                    },
                    properties: {
                        enable: { type: "array", items: { type: "string" } },
                        disable: { type: "array", items: { type: "string" } }
                    }
                },
                queries: {
                    type: "object",
                    default: {
                        enable: ["currentUser", "emailExists", "isForgotTokenValid"],
                        disable: []
                    },
                    properties: {
                        enable: { type: "array", items: { type: "string" } },
                        disable: { type: "array", items: { type: "string" } }
                    }
                },
                mutations: {
                    type: "object",
                    default: {
                        enable: [
                            "register",
                            "validate",
                            "login",
                            "social",
                            "forgot",
                            "reset",
                            "logout",
                            "updatePassword",
                            "updateEmail",
                            "updateEmailCancel",
                            "updateEmailResend",
                            "updateEmailValidate"
                        ],
                        disable: []
                    },
                    properties: {
                        enable: {
                            type: "array",
                            items: { type: "string" }
                        },
                        disable: { type: "array", items: { type: "string" } }
                    }
                }
            }
        },
        social: { type: "object" },
        jwt: { type: "object" },
        token_extractor: { type: "object" },
        confirm: { type: "object" },
        forgot: { type: "object" },
        cache_service: { type: "string", default: "cache" }
    }
};
