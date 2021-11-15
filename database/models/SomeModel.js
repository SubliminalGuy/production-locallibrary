const mongoose = require('mongoose')

var Schema = mongoose.Schema;


var defaultBookSchema = new Schema({
    title: String,
    ISBN: Number,
    author: String
})

// Compile Model from Schema

module.exports = mongoose.model('SomeBook', defaultBookSchema)
