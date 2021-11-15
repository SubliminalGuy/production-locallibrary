var BookInstance = require('../database/models/bookinstance')
var Book = require('../database/models/book')

var async = require('async')

const { body, validationResult} = require('express-validator')


// Display list of all Bookinstances.
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if(err) { return next(err)}
            // Succesful
            res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances})
        } )

} 

// Display detail page for a specific BookInstance
exports.bookinstance_detail = (req, res, next) => {

    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, bookinstance) => {
            if (err) { return next(err)}
            if (bookinstance == null) {
                var err = new Error("Book copy not found")
                err.status = 404
                return next(err)
            }
            // Succesful
            res.render('bookinstance_detail', { title: `Copy: ${bookinstance.book.title}`, bookinstance: bookinstance})
        })
    

}

// Display BookInstance create form on GET
exports.bookinstance_create_get = (req, res, next) => {
    
    Book.find({}, 'title').exec((err, books) => {
        if (err) { return next(err)}
        // Successful
        res.render('bookinstance_form', {title: 'Create Bookinstance', book_list: books})
    })
}
// Handle BookInstance create on POST
exports.bookinstance_create_post = [
    
    // Validate and sanitize
    body('book', 'Book must be specified').trim().isLength({min: 1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid Date').optional({checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req)

        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            }
        )

        if (!errors.isEmpty()) {
            //Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec((err, books) => {
                    if (err) { return next(err)}
                    // Succesful
                    res.render('bookinstance_form', { title: 'Create Bookinstance', book_list: books, selected_book: bookinstance.book_id, errors: errors.array(), bookinstance: bookinstance})
                })
                return
        }
        else {
            // Data from form is valid.
            bookinstance.save(err => {
                if (err) {return next(err)}
                //Succesful
                res.redirect(bookinstance.url)
            })
        }
    }
]
// Display BookInstance delete form on GET
exports.bookinstance_delete_get = (req, res, next) => {

    async.waterfall([
        function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec((err, bookinstance) => {
                if (err) {return next(err)}
                callback(null, bookinstance)
            })
            
        },
        function(bookinstance, callback) {
            Book.findById(bookinstance.book._id).populate('author').populate('genre').exec((err, book) => {
                if (err) {return next(err)}
                callback(null, {book, bookinstance})
            })
        }
    
    ], (err, results) => {
            if (err) { return next(err)}
            // Succesful
            res.render('bookinstance_delete', { title: 'Delete Book', bookinstance: results.bookinstance, book: results.book})
    })   

} 

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = (req, res, next) => {
    
    // Delete Bookinstance object and redirect
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err) {
        if (err) { return next(err)}
        // Success
        res.redirect('/catalog/bookinstances')
    })
    
}
// Display BookInstance update form on GET
exports.bookinstance_update_get = (req, res, next) => {
    
    async.parallel({
        bookinstance: callback => BookInstance.findById(req.params.id).populate('book').exec(callback),
        books: callback => Book.find({}, 'title').exec(callback)
    }, (err, results) => {
        
        if (err) { return next(err)}
            if (results.bookinstance==null) {
                var err = new Error('Book not found')
                err.status = 404
                return next(err)
            }
            // Success
            res.render('bookinstance_form', {title: 'Update Bookinstance', bookinstance: results.bookinstance, book_list: [results.bookinstance.book] })
        }
        // Decided to only render the actual book and not the whole book list. Another approach where you canchange the book to which the bookinstance refers is possible.
    )
}
// Handle BookInstance update on POST
exports.bookinstance_update_post = [
    // Validate and sanitize
    body('book', 'Book must be specified').trim().isLength({min: 1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid Date').optional({checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req)

        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id // If this isn't delivered new ID will be created and assigned!
            }
        )
        

        if (!errors.isEmpty()) {
            res.render('bookinstance_form', { title: 'Update Bookinstance', bookinstance: results.bookinstance, book_list: [results.bookinstance.book], errors : errors.array()})
        } 
        else {
            // Data from form is valid. Update the record.
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, theauthor) => {
                if (err) { return next(err)}
                // Successful
                res.redirect(theauthor.url)
            })
        }

    }
    
    
]