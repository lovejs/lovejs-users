module.exports = () => {
    return () =>
        async function(root, args, context, info, next) {
            const user = await context.getUser();
            if (!user) {
                throw new Error("Permission denied buddy.");
            }
            context.user = user;
            return await next();
        };
};
