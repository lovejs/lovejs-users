const _ = require("lodash");
const { Middleware } = require("@lovejs/components/middlewares");

class PermissionsMiddleware extends Middleware {
    getOptionsSchema() {
        return { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] };
    }

    normalizeOptions(options) {
        options = super.normalizeOptions(options);

        if (_.isString(options)) {
            options = [options];
        }

        return options;
    }

    getMiddleware(permissions) {
        return async context => {
            context.hasPermissions(permissions);
        };
    }
}

module.exports = PermissionsMiddleware;
