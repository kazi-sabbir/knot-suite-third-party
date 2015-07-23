var request = require("request");
var knotSettings = require("../configs/knotSettings");
var signal = function () {
    return {
        saveSignalFromGitWebHook: saveSignalFromGitWebHook
    }

    function composeSignalContent(hookObj) {
        switch (hookObj.hookHeader["x-github-event"]) {
            case "issue_comment":
                var content = "[" + hookObj.hookData.repository.full_name + "] " + "New comment on issue " + "\n"
                    + "Commented by " + hookObj.hookData.comment.user.login + "\n"
                    + hookObj.hookData.comment.body;
                return {
                    content: content,
                    ogDataUrl:  hookObj.hookData.issue.html_url
                };
                break;
            case "push":
                var content = "[" + hookObj.hookData.repository.full_name + ": "+hookObj.hookData.ref.substr(hookObj.hookData.ref.lastIndexOf("/")+1, hookObj.hookData.ref)+"] " + "1 new commit by " + "\n"
                + hookObj.hookData.commits[0].committer.name +"\n"
                    +"Commit message: "+ hookObj.hookData.head_commit.message;
                return {
                    content: content,
                    ogDataUrl:  hookObj.hookData.head_commit.url
                };
            break;
        }
    }

    function saveSignalFromGitWebHook(gitHook, hookObj) {
        console.log("Saving signal");

        var signalData = composeSignalContent(hookObj);

        gitHook.orgList.forEach(function (org) {
            var data = {
                accessToken: gitHook.knotAccessToken,
                content: signalData.content,
                spaceId: null,
                rootId: null,
                verb: null,
                object: null,
                activityType: "Composed-DashBoard",
                objectTags: {
                    objectTags: [],
                    hashTags: [],
                    privateTags: []
                },
                ogdataObject: {
                    ogTitle: "",
                    ogDescription: "",
                    ogImage: "",
                    isOgData: false,
                    url: ""
                },
                attachments: [],
                orgId: org,
                visibility: {
                    scope: "Organization",
                    privacy: "AllEmployee"
                }
            };



            request({
                url: knotSettings.knotSuiteServiceUrl + "/api/service/linkService/ogData",
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"url": signalData.ogDataUrl})
            },function(err,res,body){
               if(!res.code){

                   var ogdataObject = {
                       ogTitle: res.ogData.title,
                       ogDescription: res.ogData.description,
                       ogImage: res.ogData.images.length >0 ?  res.ogData.images[0] : "",
                       isOgData: true,
                       url: signalData.ogDataUrl
                   }

                   data.ogdataObject = ogdataObject;

                   request({
                       url: knotSettings.knotSuiteServiceUrl + "/api/signals/saveSignal",
                       method: "POST",
                       headers: {
                           "Content-Type": "application/json"
                       },
                       body: JSON.stringify(data)
                   }, function (err, res, body) {
                       if (err) {
                           console.log(err);
                       } else {
                           console.log(res.body);
                       }
                   });
               }
            });

        });
    }
};

module.exports = signal();
