module.exports = () => {
    return () =>
        async function(root, args, context, info, next) {
            const user = await context.getUser();
            if (!user) {
                throw new Error("Authentication required");
            }

            context.user = user;
            return await next();
        };
};
