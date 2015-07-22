var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hookSchema = new Schema({
    hookData: {},
    hookHeader: {},
    repoId: {type: Number},
    orgList: [],
    knotAccessToken: String,
    hookList: []
});

var GitHook = mongoose.model('GitHook', hookSchema);

module.exports = GitHook;