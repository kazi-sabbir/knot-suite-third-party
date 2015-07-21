var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    accessToken: String,
    userData: {

    },
    connectedRepositories:Array
});

var User = mongoose.model('User', userSchema);

module.exports = User;