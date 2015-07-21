var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hookSchema = new Schema({
    hookData : {}
});

var Hook = mongoose.model('Hook', hookSchema);

module.exports = Hook;