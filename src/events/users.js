module.exports = Object.freeze({
    LOGIN: "users.LOGIN",
    REGISTER: "users.REGISTER",
    SOCIAL: {
        AUTHED: "users.SOCIAL.AUTHED",
        LINKED: "users.SOCIAL.LINKED",
        REGISTER: "users.SOCIAL.REGISTER"
    },

    CONFIRM: "users.CONFIRM", // User need confirm
    VALIDATE: "users.VALIDATE", // User did validate

    FORGOT: "users.FORGOT",
    RESET: "users.RESET",

    UPDATE_PASSWORD: "users.UPDATE_PASSWORD",
    UPDATE_EMAIL: "users.UPDATE_EMAIL",
    UPDATE_EMAIL_CANCEL: "users.UPDATE_EMAIL_CANCEL",
    UPDATE_EMAIL_RESEND: "users.UPDATE_EMAIL_RESEND",
    UPDATE_EMAIL_VALIDATE: "users.UPDATE_EMAIL_VALIDATE"
});
