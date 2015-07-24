var express = require('express');
var router = express.Router();

router.post("/createNewHook", function (req, res, next) {

    var newHookParams = {
        hookName : req.body.hookName,
        knotSuiteAccessToken : req.body.knotSuiteAccessToken,
        hashTags: req.body.hashTags,
        iconUrl: req.body.iconUrl,
        orgList: req.body.orgList
    }

});

