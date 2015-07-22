var     _ = require("lodash");

var settings = {
    production: {
        apiServerUrl:"http://polar-scrubland-5825.herokuapp.com",
        dbUrl:"mongodb://atish:1@ds047107.mongolab.com:47107/knot-third-party",
        clientId:"2a16ba35e3663da1e8cb",
        secret: "b96b7c67434b7f74af613ac039e05264d8a37fbb",
        callBackUrl: "http://polar-scrubland-5825.herokuapp.com/api/gitHub/registerNewAccountCallBackHandler",
        gitHubWebHookUrl: "http://polar-scrubland-5825.herokuapp.com/api/gitHub/getNewWebHook",
        knotSuiteServiceUrl: "https://prod-frontserver.herokuapp.com"
    },

    development: {
        apiServerUrl:"localhost:3000",
        dbUrl:"mongodb://atish:1@ds047107.mongolab.com:47107/knot-third-party",
        clientId:"009c980833f3a00ba8b8",
        secret: "d99bddefb48c8dc66a90b39f3a91ec94e3c02d68",
        callBackUrl: "http://localhost:3000/api/gitHub/registerNewAccountCallBackHandler",
        gitHubWebHookUrl: "http://polar-scrubland-5825.herokuapp.com/api/gitHub/getNewWebHook",
        knotSuiteServiceUrl: "https://prod-frontserver.herokuapp.com"
    }
};

var env = process.env.NODE_ENV;
var config = _.contains(["production", "staging", "qa"], env) ? settings[env] : settings["development"];

//exports.config = config;
module.exports = config;