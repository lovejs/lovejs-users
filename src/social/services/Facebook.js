const _ = require("lodash");

const oauth_path = "oauth/access_token";

class FacebookService {
    constructor({ app_id, app_secret, fields, version = "v2.11" }) {
        this.app_id = app_id;
        this.app_secret = app_secret;
        this.fields = fields;
        this.version = version;
    }

    getFb() {
        if (!this.fb) {
            const { Facebook, FacebookApiException } = require("fb");
            this.fb = new Facebook({
                Promise: require("bluebird"),
                version: this.version,
                appId: this.app_id,
                appSecret: this.app_secret
            });
        }

        return this.fb;
    }

    getApp() {
        return { client_id: this.app_id, client_secret: this.app_secret };
    }

    cleanPath(path) {
        return path.replace(`https://graph.facebook.com/${this.version}`, "");
    }

    async api() {
        arguments[0] = this.cleanPath(arguments[0]);
        return await this.getFb().api(...arguments);
    }

    async getAppAccessToken() {
        return await this.api(oauth_path, { ...this.getApp(), grant_type: "client_credentials" });
    }

    async getExtendedAccessToken(fb_exchange_token) {
        return await this.api(oauth_path, { ...this.getApp(), grant_type: "fb_exchange_token", fb_exchange_token });
    }

    async getCurrentUser(access_token, fields = false, extended = true) {
        if (extended) {
            const res = await this.getExtendedAccessToken(access_token);
            access_token = res.access_token;
        }

        const res = await this.api("/me", { fields: fields || this.fields, access_token });
        return { ...res, access_token };
    }

    async getProfile(access_token, fields = false) {
        const user = await this.getCurrentUser(access_token, fields);

        return {
            id: user.id,
            token: user.access_token,
            email: user.email,
            image: _.get(user, "cover.source"),
            name: user.name,
            first_name: user.first_name,
            last_name: user.last_name,
            gender: user.gender == "female" ? "F" : "M",
            locale: user.locale
        };
    }
}

module.exports = FacebookService;

/*
'use strict';

var _       = require('lodash');
var Promise = require('bluebird');
var fb      = require('fb');
var fbgraph = require('fbgraph');
var moment  = require('moment');
var querystring = require('querystring');

exports = module.exports = function(settings, crawler, logger, context) {
	return new Facebook(settings, crawler, logger, context);
}

exports['@singleton'] = true;
exports['@require'] = [ 'settings', 'services/crawler', 'logger', 'services/context' ];

class Facebook {

    constructor(settings, crawler, logger, context) {
        this.settings = settings;
        this.crawler  = crawler;
        this.logger   = logger;
        this.context  = context;
    }

    getAppAccessToken() {
        return this._api('oauth/access_token', {
            client_id:      this.settings.get('facebook.appId'),
            client_secret:  this.settings.get('facebook.appSecret'),
            grant_type:     'client_credentials'
        });
    }

    extendAccessToken(accessToken) {
        return new Promise((resolve, reject) => {
            fbgraph.extendAccessToken({
                client_id:      this.settings.get('facebook.appId'),
                client_secret:  this.settings.get('facebook.appSecret'),
                access_token:   accessToken
            }, function (err, facebookRes) {
                return err ? reject(err) : resolve(facebookRes.access_token);
            });
        });
    }

    _api(path, params) {
        fbgraph.setVersion(this.settings.get('facebook.version'));
        return new Promise((resolve, reject) => {
            this.logger.info("[FB] "+ path + "?" + querystring.stringify(params));
            console.log("Calling FB "+path + "?" + querystring.stringify(params));
            fbgraph.get(path, params, (err, res) => {
                if (err || res.error) {
                    console.log("[ERROR FB API] : ", res);
                    this.logger.error('[FB ERROR] '+path+' : ', res.error);
                    return reject({type: "facebook", code: res.error.code});
                } else {
                    return resolve(res);
                }
            });
        });
    }

    api(path, params) {
        var accessToken     = this.context.get('access_token');
        var longAccessToken = this.context.get('access_token_long');
        var appAccessToken  = this.context.get('access_token_app');
        var params          = params ? params : {};

        var p;

        if (params.access_token) {
            p = Promise.resolve(params.access_token);
        } else if (longAccessToken) {
            p = Promise.resolve(longAccessToken);
        } else if (accessToken) {
            p = this.extendAccessToken(accessToken)
                .then((extendedAccessToken) => {
                    this.context.set({access_token_long: extendedAccessToken});
                    return extendedAccessToken;
                });
        } else if (appAccessToken) {
            p = Promise.resolve(appAccessToken);
        } else {
            p = this.getAppAccessToken()
                .then((result) => {
                    this.context.set({access_token_app: result.access_token});
                    return result.access_token;
                });
        }

        return p.then((accessToken) => {
            params['access_token'] = accessToken;
            return this._api(path, params);
        });
    }

    searchEvents(search) {
        return this.objectEvents({path: '/search', params: {q: 'salsa lyon', type: 'event'}});
    }

    pageEvents(page) {
        return this.objectEvents(page);
    }

    groupEvents(group) {
        return this.objectEvents(group);
    }

    memberEvents(userFbId, token) {
        const types = ['attending', 'created', 'declined', 'maybe', 'not_replied'];
        return Promise.map(types, (type) => {
            return this.objectEvents({path: '/'+userFbId+'/events', params: {access_token: token, type: type}})
        }, {concurrency: 1}).then(results => {
            let eventIds = [];
            _.each(results, (result) => {
                eventIds = _.concat(eventIds, result.eventIds ? result.eventIds : []);
            });

            return eventIds;
        })
    }

    objectEvents(object, currentEvents, cursor) {
        if (!this.context.hasToken()) {
            if (_.isObject(object) && object.params && object.params.access_token) {

            } else {
                return Promise.resolve({error: "Missing context token"});
            }
        }

        var limit      = 100;
        var endPoint, baseParams;

        if (_.isObject(object)) {
            endPoint   = object.path;
            baseParams = object.params ? object.params : false;
        } else {
            var reg = /-([0-9]+)$/;
            var res = reg.exec(object);
            if (res && res[1]) {
                object = res[1];
            }
            endPoint = '/'+object+'/events';
        }

        var fields   = 'id';
        var options  = {fields: fields, limit: limit, since: moment().subtract(5, "days").toISOString()};

        if (baseParams) {
            options = _.extend(options, baseParams);
        }

        if (!currentEvents) {
            currentEvents = [];
        }

        if (cursor) {
            options['after'] = cursor;
        }

        return this.api(endPoint, options)
                   .then((res) => {
                        if (!res) {
                            return {eventIds: currentEvents};
                        }
                        var events = _.union(_.map(res.data, 'id'), currentEvents);
                        var paging = res.paging;

                        if (paging && paging.cursors && paging.cursors.after) {
                            return this.objectEvents(object, events, paging.cursors.after);
                        } else {
                            return {eventIds: events};
                        }
                    }, (error) => {
                        return {eventIds: currentEvents, error: error};
                    });
    }

    userEvents(user) {
        if (!this.context.hasCookies()) {
            return Promise.resolve({error: "Missing context cookies"});
        }
        return this.crawler.crawlPage('www.facebook.com', 443, "/"+user+"/events", /\/events\/([0-9]+)/g);
    }


    getEvents(eventIds) {
        var endPoint = '/';
        var fields = this.settings.get('facebook.events.fields').join(",");

        var eventIdsChunks = _.chunk(eventIds, 50);
        return Promise.map(eventIdsChunks, (eventIds) => {
            var params = {ids: eventIds.join(','), fields: fields};
            return this.api(endPoint, params);
        }, {concurrency: 1})
        .then(function(results) {
            return _.assign.apply(this, results);
        });
    }

    getEvent(eventId, accessToken) {
        var endPoint = '/' + eventId;
        var fields = this.settings.get('facebook.events.fields').join(",");
        var params = {fields: fields};
        if (accessToken) {
            params['access_token'] = accessToken;
        }

        return this.api(endPoint, params);
    }

    getCurrentUser(accessToken) {
        return this.extendAccessToken(accessToken)
                   .then(extendedToken => {
                       const params = {'access_token': extendedToken, fields: 'id,name,birthday,cover,email,gender,locale'};
                       return this._api('/me', params)
                                  .then(data => {
                                      return {data, token: extendedToken};
                                  })
                   })

    }

}
*/
