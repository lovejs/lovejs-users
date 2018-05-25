const queries = ["currentUser", "emailExists", "isForgotTokenValid"];
const mutations = ["register", "validate", "login", "social", "forgot", "reset", "logout", "updatePassword", "updateEmail"];

const profile = {
    oneOf: [
        { type: "boolean" },
        {
            type: "object",
            properties: {
                model: { type: "string", default: "profile" },
                service: { type: "string", default: "model:profile" },
                graphql_type: { type: "string", default: "Profile" }
            }
        }
    ]
};

const graphql = {
    type: "object",
    properties: {
        queries: {
            type: "object",
            properties: {
                enable: { type: "array", items: { enum: queries }, default: queries },
                disable: { type: "array", items: { enum: queries }, default: [] }
            }
        },
        mutations: {
            type: "object",
            properties: {
                enable: { type: "array", items: { enum: mutations }, default: mutations },
                disable: { type: "array", items: { enum: mutations }, default: [] }
            }
        }
    }
};

const jwt = {
    type: "object",
    properties: {
        secretOrKey: { type: "string" },
        issuer: { type: "string" },
        audience: { type: "string" }
    },
    required: ["secretOrKey", "issuer", "audience"]
};

const token_extractor = {
    type: "object",
    properties: {
        authorization: { type: "string", default: "bearer" }
    }
};

const schema = {
    properties: {
        profile,
        graphql,
        jwt,
        token_extractor
    },
    required: []
};

module.exports = schema;
