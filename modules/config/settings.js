"user strict";


var     _ = require("lodash");

var settings = {
    production: {
        apiServer: {
            url: "http://polar-scrubland-5825.herokuapp.com",
            port: 80
        },
        session:{
            store: "mongodb://whoozah:Whoozah2014!@192.168.172.129/whoozah",
            defaultTimeout: 60 * 60,
            extendedTimeout: 365 * 24 * 60 * 60
        }
    },

    development: {
        apiServer: {
            url: "localhost",
            port: 3000
        },
        session:{
            store: "mongodb://localhost/whoozah_api",
            defaultTimeout: 60 * 60,
            extendedTimeout: 365 * 24 * 60 * 60
        }
    }
};

var env = process.env.NODE_ENV;
var config = _.contains(["production", "staging", "qa"], env) ? settings[env] : settings["development"];

exports.config = config;