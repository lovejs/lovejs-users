module.exports = UserExtractor => {
    return (context, request) => {
        context.getUser = async () => {
            if (request.user !== undefined) {
                return request.user;
            }
            request.user = await UserExtractor.getUser(request);
            return request.user;
        };
    };
};
