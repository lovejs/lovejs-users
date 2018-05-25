const domainsWithTags = {
    // Google only has two Gmail domains: https://en.wikipedia.org/wiki/List_of_Google_domains
    "gmail.com": "+",
    "googlemail.com": "+",
    "google.com": "+", // corporate email addresses; TODO presumably country domains also receive corporate email?
    // Microsoft
    "outlook.com": "+",
    "hotmail.com": "+",
    "live.com": "+",
    // Fastmail - https://www.fastmail.com/help/receive/addressing.html TODO: whatever@username.fastmail.com -> username@fastmail.com
    "fastmail.com": "+",
    "fastmail.fm": "+",
    // Yahoo Mail Plus accounts, per https://en.wikipedia.org/wiki/Yahoo!_Mail#Email_domains, use hyphens - http://www.cnet.com/forums/discussions/did-yahoo-break-disposable-email-addresses-mail-plus-395088/
    "yahoo.com.ar": "-",
    "yahoo.com.au": "-",
    "yahoo.at": "-",
    "yahoo.be/fr": "-",
    "yahoo.be/nl": "-",
    "yahoo.com.br": "-",
    "ca.yahoo.com": "-",
    "qc.yahoo.com": "-",
    "yahoo.com.co": "-",
    "yahoo.com.hr": "-",
    "yahoo.cz": "-",
    "yahoo.dk": "-",
    "yahoo.fi": "-",
    "yahoo.fr": "-",
    "yahoo.de": "-",
    "yahoo.gr": "-",
    "yahoo.com.hk": "-",
    "yahoo.hu": "-",
    "yahoo.co.in/yahoo.in": "-",
    "yahoo.co.id": "-",
    "yahoo.ie": "-",
    "yahoo.co.il": "-",
    "yahoo.it": "-",
    "yahoo.co.jp": "-",
    "yahoo.com.my": "-",
    "yahoo.com.mx": "-",
    "yahoo.ae": "-",
    "yahoo.nl": "-",
    "yahoo.co.nz": "-",
    "yahoo.no": "-",
    "yahoo.com.ph": "-",
    "yahoo.pl": "-",
    "yahoo.pt": "-",
    "yahoo.ro": "-",
    "yahoo.ru": "-",
    "yahoo.com.sg": "-",
    "yahoo.co.za": "-",
    "yahoo.es": "-",
    "yahoo.se": "-",
    "yahoo.ch/fr": "-",
    "yahoo.ch/de": "-",
    "yahoo.com.tw": "-",
    "yahoo.co.th": "-",
    "yahoo.com.tr": "-",
    "yahoo.co.uk": "-",
    "yahoo.com": "-",
    "yahoo.com.vn": "-"
};

class EmailNormalizer {
    normalize(email) {
        email = email.trim().toLowerCase();

        var emailParts = email.split(/@/);
        var user = emailParts[0];
        var domain = emailParts[1];

        user = user.replace(/[-+=].*/, "");

        if (/^(gmail|googlemail|google)\.com$/.test(domain)) {
            user = user.replace(/\./g, "");
        }

        if (domain === "googlemail.com") {
            domain = "gmail.com";
        }

        return user + "@" + domain;
    }
}

module.exports = EmailNormalizer;

