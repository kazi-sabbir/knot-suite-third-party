var express = require('express');
var router = express.Router();

var Url = require("url");
var querystring = require("querystring");

var Client = require("github");
var OAuth2 = require("oauth").OAuth2;
var User = require("../models/user");
var Hook = require("../models/hook");

var github = new Client({
    version: "3.0.0"
});

var clientId = "2a16ba35e3663da1e8cb";
var secret = "b96b7c67434b7f74af613ac039e05264d8a37fbb";
var oauth = new OAuth2(clientId, secret, "https://github.com/", "login/oauth/authorize", "login/oauth/access_token");
var accessToken = "";

router.get("/", function (req, res, next) {
    var url = Url.parse(req.url);
    var path = url.pathname;
    console.log("path " + path);

    if (path == "/" || path.match(/^\/user\/?$/)) {
        // redirect to github if there is no access token
        console.log("path " + path);
        if (!accessToken) {
            res.writeHead(303, {
                Location: oauth.getAuthorizeUrl({
                    redirect_uri: 'http://polar-scrubland-5825.herokuapp.com/api/github',
                    scope: "user,repo,gist"
                })
            });

            res.end();
            return;
        }
                
        // use github API            
        github.user.get({}, function (err, user) {
            if (err) {
                res.writeHead(err.code);
                res.end(err + "");
                return;
            }
            res.writeHead(200);
            console.log(JSON.stringify(user));
            var newUser = new User({
                accessToken: accessToken,
                userData: user,
                connectedRepositories: []
            });

            newUser.save(function(err) {
                if (err) throw err;
                console.log('User created!');
                res.end(JSON.stringify(user));
            });

        });
        return;
    }


    res.writeHead(404);
    res.end("404 - Not found");
});


router.post("/getAllRepos", function (req, res, next) {
    var accessToken = req.body.accessToken;
    github.authenticate({
        type: "oauth",
        token: accessToken
    });

    github.repos.getAll({

    }, function (err, data) {
            if (err) {
                console.log(err);
            }
            console.log(JSON.stringify(data));
            res.send(JSON.stringify(data));
        });
});

router.post("/webhook",function(req,res,next){
    console.log("web hook fired");
   //console.log(JSON.stringify(res));
   //console.log(JSON.stringify(req.body) + "req body");
    console.log(req.body);
    for(var r in req){
        console.log(r);
    }

    var newHook = new Hook({
        hookData: req.body
    });

    newHook.save(function(err){
       if(err){
           console.log(err);
       }
        console.log("hook saved");

    });

    res.end();
});

router.post("/createWebHook", function (req, res, next) {
    var accessToken = req.body.accessToken;
    github.authenticate({
        type: "oauth",
        token: accessToken
    });

    github.repos.createHook({
        user: 'dipongkor',
        name: 'web',
        repo: 'GitVpm',
        config: {
            "url": "http://polar-scrubland-5825.herokuapp.com/api/webhook",
            "content_type": "json"
        },
        events: ["commit_comment",
            "create",
            "delete",
            "deployment",
            "deployment_status",
            "download",
            "follow",
            "fork",
            "fork_apply",
            "gist",
            "gollum",
            "issue_comment",
            "issues",
            "member",
            "public",
            "pull_request",
            "pull_request_review_comment",
            "push",
            "release",
            "status",
            "team_add",
            "watch"]
    }, function (err, data) {
            if (err) {
                console.log(err);
                res.send(JSON.stringify(err));
            }
            res.send(JSON.stringify(data));

        });

});


router.get('/github', function (req, res, next) {
    console.log("call back fired");

    var url = Url.parse(req.url);
    var query = querystring.parse(url.query);
    oauth.getOAuthAccessToken(query.code, {}, function (err, access_token, refresh_token) {

        if (err) {
            console.log(err);
            res.writeHead(500);
            res.end(err + "");
            return;
        }

        accessToken = access_token;

        console.log("access token " + accessToken);
        // authenticate github API
        github.authenticate({
            type: "oauth",
            token: accessToken
        });
              
        //redirect back
        
        github.user.get({}, function (err, user) {
            if (err) {
                res.writeHead(err.code);
                res.end(err + "eroor");
                return;
            }
            console.log(JSON.stringify(user));
            console.log("user found in call back");

        });

        res.writeHead(303, {
            Location: "/"
        });
        res.end();
    });


});

module.exports = router;