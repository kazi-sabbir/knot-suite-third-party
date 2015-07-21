var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://atish:1@ds047107.mongolab.com:47107/knot-third-party');

var userSchema = new Schema({
    accessToken: String,
    userData: {

    },
    connectedRepositories:Array
});

var User = mongoose.model('User', userSchema);

module.exports = User;