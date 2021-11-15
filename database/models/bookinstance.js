const mongoose = require('mongoose')
const {DateTime} = require('luxon')

var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema(
    {
        book: { type: Schema.Types.ObjectId, ref: "Book", required: true},
        imprint: {type: String, required: true},
        status: { type: String, required: true, enmum: ["Available", "Maintenance", "Loaned", "Reserved"], default: "Maintenance"},
        due_back: { type: Date, default: Date.now}
    }
);

// Virtual for Bookinstance url
BookInstanceSchema
    .virtual("url")
    .get(function() {
        return `/catalog/bookinstance/${this._id}`
    })

// Virtual for formatted Date
BookInstanceSchema
    .virtual('due_back_formatted')
    .get(function() {
        return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED)
    })
// Virtual for ISO Date format
BookInstanceSchema
    .virtual('due_back_yyyy_mm_dd')
    .get(function() {
    return DateTime.fromJSDate(this.due_back).toISODate(); //format 'YYYY-MM-DD'
    })

module.exports = mongoose.model('BookInstance', BookInstanceSchema)