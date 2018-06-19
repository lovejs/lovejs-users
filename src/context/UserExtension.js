class UserExtension {
    constructor(UserExtractor) {
        this.UserExtractor = UserExtractor;
    }

    register(ContextClass) {
        const extractor = this.UserExtractor;

        return class extends ContextClass {
            async getUser() {
                if (!this.hasAttribute("user")) {
                    const user = await extractor.getUser(this.getRequest());
                    this.setAttribute("user", user);
                }

                return this.getAttribute("user");
            }
        };
    }
}

module.exports = UserExtension;
