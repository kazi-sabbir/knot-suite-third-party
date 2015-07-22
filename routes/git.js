var express = require('express');
var router = express.Router();
var Url = require("url");
var querystring = require("querystring");
var Client = require("github");
var OAuth2 = require("oauth").OAuth2;
var User = require("../models/user");
var GitHook = require("../models/gitHook");
var knotSettings = require("../configs/knotSettings");
var _ = require("lodash");

var github = new Client({
    version: "3.0.0"
});

var clientId = knotSettings.clientId;
var secret = knotSettings.secret;
var oauth = new OAuth2(clientId, secret, "https://github.com/", "login/oauth/authorize", "login/oauth/access_token");

router.get("/registerNewAccount", function (req, res, next) {
    var url = Url.parse(req.url);
    var path = url.pathname;
    var knotSuiteAccessToken = req.query.knotSuiteAccessToken;

    User.findOne(
        {
            'knotSuiteAccessToken': knotSuiteAccessToken
        },
        function (err, user) {
            if (err) {
                console.log(err);
                res.send({
                    message: 'Database error',
                    code: -1,
                    error: err
                });
            }
            if (!user) {
                res.writeHead(303, {
                    Location: oauth.getAuthorizeUrl({
                        redirect_uri: knotSettings.callBackUrl + "?knotSuiteAccessToken=" + knotSuiteAccessToken + "",
                        scope: "repo"
                    })
                });

                res.end();
                return;
            }

            res.send({
                message: "User Already registered",
                code: 1,
                data: user
            });
            return;
        });
});

router.get('/registerNewAccountCallBackHandler', function (req, res, next) {
    var url = Url.parse(req.url);
    var query = querystring.parse(url.query);
    var knotSuiteAccessToken = query.knotSuiteAccessToken;

    User.findOne({
        knotSuiteAccessToken: knotSuiteAccessToken
    }, function (err, user) {
        if (err) {
            console.log(err);
            res.send({
                message: "Database error",
                code: -1,
                error: err
            });
        }
        if (!user) {
            oauth.getOAuthAccessToken(query.code, {}, function (err, access_token, refresh_token) {

                if (err) {
                    console.log(err);
                    res.writeHead(500);
                    res.send({
                        message: "GitHub error",
                        code: -1,
                        error: err
                    });
                    return;
                }

                console.log("access token " + access_token);

                github.authenticate({
                    type: "oauth",
                    token: access_token
                });

                github.user.get({}, function (err, user) {
                    if (err) {
                        res.writeHead(err.code);
                        res.send({
                            message: "User not found",
                            code: -1,
                            error: err
                        });
                        return;
                    }

                    var newUser = new User({
                        gitAccessToken: access_token,
                        knotSuiteAccessToken: knotSuiteAccessToken,
                        userData: user
                    });

                    newUser.save(function (err) {
                        if (err) {
                            console.log(err);
                            res.send({
                                message: "Database error",
                                code: -1,
                                error: err
                            });
                        }
                        res.send({
                            message: "User registered successfully",
                            code: 1,
                            data: newUser
                        });
                    });

                });
            });
        }else{
            res.send({
                message: "User already registered",
                code: 1,
                data: user
            });
        }
    });
});

router.post("/getAllRepos", function (req, res, next) {
    var knotSuiteAccessToken = req.body.knotSuiteAccessToken;

    User.findOne({
        knotSuiteAccessToken: knotSuiteAccessToken
    }, function (err, user) {
        if (err) {
            console.log(err);
            res.send({
                message: "Database Error",
                code: -1,
                error: err
            });
        }
        if (user) {
            github.authenticate({
                type: "oauth",
                token: user.gitAccessToken
            });

            github.repos.getAll({
                type: 'owner'
            }, function (err, data) {
                if (err) {
                    console.log(err);
                }
                console.log(JSON.stringify(data));

                //var result = _.filter(data,'id')
                res.send(data);
            });
        } else {
            res.send({
                message: "User not found",
                code: 0,
                error: null
            });
        }
    });
});

router.post("/getNewWebHook", function (req, res, next) {
    console.log("web hook fired");

    GitHook.findOne({repoId: req.body.repository.id},function(err,gitHook){
       if(err){
           console.log(err);
           req.end();
       }

        if(gitHook){
            gitHook.hookData = req.body;
            gitHook.hookHeader = req.headers;
            gitHook.hookList.push(req.body);

            gitHook.save(function(err){
                if(err){
                    console.log(err);
                }
                console.log("Hook updated");
                res.end();
            });
        }else{
            console.log("Hook not found");
            req.end();
        }
    });
});

router.post("/createNewWebHook", function (req, res, next) {
    var newWebHookParams = {
        knotSuiteAccessToken: req.body.knotSuiteAccessToken,
        orgList: req.body.orgList,
        gitRepo: req.body.gitRepo,
        gitEvents: req.body.gitEvents
    };

    User.findOne(
        {
            knotSuiteAccessToken: newWebHookParams.knotSuiteAccessToken
        }, function (err, user) {
            if (err) {
                console.log(err);
                res.send({
                    message: "Database Error",
                    code: -1,
                    error: err
                });
            }

            if (user) {
                github.authenticate({
                    type: "oauth",
                    token: user.gitAccessToken
                });

                github.repos.createHook({
                    user: user.userData.login,
                    name: "web",
                    repo: newWebHookParams.gitRepo.name,
                    config: {
                        "url": knotSettings.gitHubWebHookUrl,
                        "content_type": "json"
                    },
                    events: newWebHookParams.gitEvents
                }, function (err, data) {
                    if (err) {
                        console.log(err);
                        res.send(
                            {
                                message: "GitHub error",
                                code: -1,
                                error: err
                            }
                        );
                    } else {
                        newWebHookParams.gitRepo.hookData = data;
                        user.connectedRepositories.push(newWebHookParams.gitRepo)
                        user.save(function (err) {
                            if (err) {
                                console.log(err);
                            }

                            var newGitHook = new GitHook({
                                hookData: {},
                                hookHeader: {},
                                repoId: newWebHookParams.gitRepo.id,
                                orgList: newWebHookParams.orgList,
                                knotAccessToken: newWebHookParams.knotSuiteAccessToken
                            });

                            newGitHook.save(function(err){
                                if(err){
                                    console.log(err);
                                }
                                res.send({
                                    message: "GitHub web hook created successfully",
                                    code: 1,
                                    data: user
                                });
                            });
                        })
                    }
                });
            }
        }
    );
});

router.post("/deleteHook",function(req,res,next){
    //console.log(req.body);
    github.authenticate({
        type: "oauth",
        token: req.body.gitAccessToken
    });

    github.repos.deleteHook(
        {
            user: req.body.user,
            repo: req.body.repo,
            id: req.body.hookId
        },function(err,data){
            if(err){
                //console.log(req)
                res.send(err);
            }else{


                User.findOne({gitAccessToken: req.body.gitAccessToken},function(err,user){
                   if(user){
                       var repo = _.find(user.connectedRepositories,{id: req.body.repoId});
                       console.log(repo);
                       if(repo){
                           var index = user.connectedRepositories.indexOf(repo);
                           user.connectedRepositories.splice(index,1);
                           user.save(function(err){
                               if(err){
                                   res.send(data);
                               }else{
                                   res.send(user);
                               }
                           })
                       }
                   }
                });
            }
        }
    );
});

module.exports = router;