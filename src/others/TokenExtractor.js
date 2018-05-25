const url = require("url");
const _ = require("lodash");
const re = /(\S+)\s+(\S+)/;

const parseAuthHeader = hdrValue => {
    if (typeof hdrValue !== "string") {
        return null;
    }
    var matches = hdrValue.match(re);
    return matches && { scheme: matches[1], value: matches[2] };
};

class TokenExtractor {
    constructor(extractors = {}) {
        this.extractors = extractors;
    }

    extractToken(request) {
        for (let extractor in this.extractors) {
            let location = this.extractors[extractor];
            location = _.isArray(location) ? location : [location];
            let token;
            switch (extractor) {
                case "body":
                    token = this.fromBody(request, location);
                    break;
                case "authorization":
                    token = this.fromAuthorization(request, location);
                    break;
                case "header":
                    token = this.fromHeader(request, location);
                    break;
                case "query":
                    token = this.fromQuery(request, location);
                    break;
                case "cookie":
                    token = this.fromCookie(request, location);
                    break;
            }

            if (token) {
                return token;
            }
        }
    }

    fromHeader(request, headers) {
        for (let header of headers) {
            if (request.headers[header]) {
                return request.headers[header];
            }
        }
        return false;
    }

    fromBody(request, fields) {
        for (let field of fields) {
            if (request.body && Object.prototype.hasOwnProperty.call(request.body, field)) {
                return request.body[field];
            }
        }
        return false;
    }

    fromQuery(request, parameters) {
        const parsed = url.parse(request.url, true);
        if (!parsed.query) {
            return false;
        }

        for (let parameter of parameters) {
            if (Object.prototype.hasOwnProperty.call(parsed.query, parameter)) {
                return parsed.query[parameter];
            }
        }
        return false;
    }

    fromAuthorization(request, schemes) {
        const authorization = request.headers.authorization;
        if (!authorization) {
            return false;
        }

        for (let scheme of schemes) {
            const res = parseAuthHeader(authorization);
            if (res && scheme.toLowerCase() == res.scheme.toLowerCase()) {
                return res.value;
            }
        }
        return false;
    }

    fromCookie(request, cookies) {
        return false;
    }
}

module.exports = TokenExtractor;
