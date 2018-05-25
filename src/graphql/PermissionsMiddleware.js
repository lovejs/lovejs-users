module.exports = () => {
    return lapermission => {
        return async function(root, args, context, info, next) {
            return await next();
        };
    };
};
