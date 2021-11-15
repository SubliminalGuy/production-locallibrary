var Book = require('../database/models/book')
var Author = require('../database/models/author')
var Genre = require('../database/models/genre')
var BookInstance = require('../database/models/bookinstance')

var async = require('async')
const { body, validationResult} = require('express-validator')

exports.index = (req, res) => {
    
    async.parallel({
        book_count: (callback) => Book.countDocuments({}, callback),
        book_instance_count: (callback) => BookInstance.countDocuments({}, callback),
        book_instance_available_count: (callback) => BookInstance.countDocuments({status: 'Available'}, callback),
        author_count: (callback) => Author.countDocuments({}, callback),
        genre_count: (callback) => Genre.countDocuments({}, callback)
    }, (err, results) => res.render('index', {title: 'Local Library Home', error: err, data: results} )
    )
}

// Display list of all Books.

exports.book_list = (req, res, next) => {

    Book.find({}, 'title author')
        .sort({title: 1})
        .populate('author')
        .exec((err, list_books) => {
            if (err) { return next(err);}
            // Succesful
            res.render('book_list', {title: 'Book List', book_list: list_books})
        })

}

// Display detail page for a specific book
exports.book_detail = (req, res, next) => {
    
    async.parallel({
        book: callback => {
            
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback)
        },
        book_instance: callback => {

            BookInstance.find({ 'book': req.params.id })
                .exec(callback)
        }
    }, (err, results) => {
            if(err) {return next(err)}
            if(results.book==null) {
                var err = new Error('Book not found')
                err.status = 404
                return next(err)
            }
            // Succesful
            res.render('book_detail', {title: results.book.title, book: results.book, book_instances: results.book_instance})
    })
}

// Display book create form on GET
exports.book_create_get = (req, res, next) => {
    // get all authors and genres
    async.parallel({
        authors: callback => Author.find(callback),
        genres: callback => Genre.find(callback)
    }, (err, results) => {
        if (err) { return next (err)}
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres})
    })
}
// Handle book create on POST
exports.book_create_post = [
    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre === 'undefined')
            req.body.genre = []
            else
            req.body.genre = new Array(req.body.genre)
        }
        next()
    },
    // Validate and sanitize
    body('title', 'Title must not be empty').trim().isLength({ min: 1}).escape(),
    body('author', 'Author must not be empty').trim().isLength({ min: 1}).escape(),
    body('summary', 'Title must not be empty').trim().isLength({ min: 1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1}).escape(),
    body('genre.*').escape(),
    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req)

        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            })

        if (!errors.isEmpty())  {
            // Errors! Render form again
            async.parallel({
                author: callback => Author.find(callback),
                genres: callback => Genre.find(callback),  
            }, (err, results) => {
                if (err) { return next(err)}
                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true'
                    }
                }
                res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres, book, errors: errors.array()})
            })
            return
        }
        else {
            // Data from form is valid. Save Book.
            book.save(err => {
                if (err) { return next(err)}
                // succesful
                res.redirect(book.url)
            })
        }
    }
]
// Display book delete form on GET
exports.book_delete_get = (req, res, next) => {
    
    async.parallel({
        book: callback => Book.findById(req.params.id).populate('author').exec(callback),
        bookinstance: callback => BookInstance.find({ 'book' : req.params.id}).exec(callback)
    },  (err, results) => {
            if (err) { return next(err)}
            if (results.book==null) {
                // No results
                res.redirect('/catalog/authors')
            }
            // Succesful
            res.render('book_delete', { title: 'Delete Book', book: results.book, bookinstances: results.bookinstance})  
    })  
}

// Handle book edelete on POST
exports.book_delete_post = (req, res, next) => {
    
    async.parallel({
        book: callback => Book.findById(req.body.bookid).exec(callback),
        bookinstance: callback => BookInstance.find({ 'book' : req.body.bookid}).exec(callback)
    }, (err, results) => {
            if (err) {return next(err)}
            // Success
            if (results.bookinstance.length > 0) {
                // Book has bookinstances!
                
                res.render('book_delete', { title: 'Delete Book', author: results.book, bookinstances: results.bookinstance}) 
                return
            }
            else {
                // Book has no instances. Delete object and redirect
                Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                    if (err) { return next(err)}
                    // Success
                    res.redirect('/catalog/books')
                })
                
            }
    })
    
}
// Display book update form on GET
exports.book_update_get = (req, res, next) => {
    
    // Get book, authors and genres for form.
    async.parallel({
        book: callback => Book.findById(req.params.id).populate('genre').exec(callback),
        authors: callback => Author.find(callback),
        genres: callback => Genre.find(callback)
    }, (err, results) => {
            if (err) { return next(err)}
            if (results.book==null) {
                var err = new Error('Book not found')
                err.status = 404
                return next(err)
            }
            // Success
            // Mark our selected genre as checked.
            for ( var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for ( var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString() === results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true'
                    }
                }
            }
            res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book})
    })
}

// Handle book update on POST
exports.book_update_post = [
    
    // Convert the genre to an array
    (req, res, next) => {
        //console.log("Genre list", req.body.genre)
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre==='undefined')
            req.body.genre=[]
            else
            req.body.genre=new Array(req.body.genre)
        }
        next()
    },

    // Validate and sanitize
    body('title', 'Title must not be empty').trim().isLength({min:1}).escape(),
    body('author', 'Author must not be empty').trim().isLength({min:1}).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({min:1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min:1}).escape(),
    body('genre.*').escape(),

    // Process request 
    (req, res, next) => {
        const errors = validationResult(req)

        // Create a Book object with escaped/trimmed updates and old id.
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre=='undefined') ? [] : req.body.genre,
                _id: req.params.id // If this isn't delivered new ID will be created and assigned!
            }
        )

        if (!errors.isEmpty()) {
            // There are errors. Render form again
            async.parallel({
                authors: callback => Author.find(callback),
                genres: callback => Genre.find(callback),   
            }, (err, results) => {
                if (err) { return next (err)}

                // Mark our selected genres as checked
                for (let i =0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true'
                    }
                }
                res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() })
            })
            return
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
                if (err) { return next(err)}
                // Successful
                res.redirect(thebook.url)
            })
        }

    }
]