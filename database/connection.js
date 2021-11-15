// Import the mongoose module
var mongoose = require('mongoose');
require('dotenv').config()

var dbUser = process.env.DB_USER;
var dbPassword = process.env.DB_PASSWORD;
var dbHost = process.env.DB_HOST;
// Setup default mongoose connection
//var mongoDB = `mongodb+srv://${dbUser}:${dbPassword}@${dbHost}/myFirstDatabase?retryWrites=true&w=majority`
var dev_db_url = `mongodb://${dbUser}:${dbPassword}@sandbox-shard-00-00.yffpj.mongodb.net:27017,sandbox-shard-00-01.yffpj.mongodb.net:27017,sandbox-shard-00-02.yffpj.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-869p5f-shard-0&authSource=admin&retryWrites=true&w=majority`
var mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})

// Get the default connection
var db = mongoose.connection;

module.exports = db