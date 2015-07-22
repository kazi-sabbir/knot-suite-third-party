var request = require("request");
var knotSettings = require("../configs/knotSettings");
var signal = function(){
    return {
        saveSignalFromGitWebHook: saveSignalFromGitWebHook
    }

    function saveSignalFromGitWebHook(gitHook, hookObj){

        gitHook.orgList.forEach(function(org){
            var data = {
                accessToken: gitHook.knotAccessToken,
                content: "EventType : " + hookObj.hookHeader["x-github-event"] + "\n" + "Source Repo : " +  hookObj.hookData.repository.name,
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
                    scope: "Self",
                    privacy: "AllConnection"
                }
            };

            request({
                url: knotSettings.knotSuiteServiceUrl +"/api/signals/saveSignal",
                method: "POST",
                data: data,
                headers: {
                    "Content-Type": "application/json"
                },
                body: data
            },function(err,res,body){
                if(err){
                    console.log(err);
                }else{
                    console.log(res);
                }
            });
        });
    }
};

module.exports = signal();
