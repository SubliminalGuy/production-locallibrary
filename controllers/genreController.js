var Genre = require('../database/models/genre')
var Book = require('../database/models/book')
var async = require('async')

const { body, validationResult} = require('express-validator')

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
    
    Genre.find()
        .sort([['name', 'ascending']])
        .exec((err, list_genres) => {
            if(err) {return next(err)}
            // Success
            res.render('genre_list', {title: 'Genre List', genre_list: list_genres})
        })

}

// Display detail page for a specific Genre
exports.genre_detail = (req, res, next) => {
    
    async.parallel({
        genre: callback => Genre.findById(req.params.id).exec(callback),
        genre_books: callback => Book.find({'genre' : req.params.id}).exec(callback)
        
    }, (err, results) => {
        if(err) {return next(err)}
        if (results.genre==null) {
            var err = new Error('Genre not found')
            err.status = 404;
            return next(err)
        }
        //Succesfuk
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books})
    })

}

// Display BGenrecreate form on GET
exports.genre_create_get = (req, res, next) => res.render('genre_form', {title: 'Create Genre'});

// Handle Genre create on POST
exports.genre_create_post = [
    // Validate and sanitize the name field.
    body('name', 'Genre name required').trim().isLength({ min: 1}).escape(),

    // process request after validation and sanitization.
    (req, res, next) => {
        // extract the validation errors from a request.
        const errors = validationResult(req)
        // create a genre object with escaped and trimmed data.
        var genre = new Genre( { name: req.body.name })

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Create Genre', genre, errors: errors.array()})
            return
        } else {
            // Data form is valid
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name})
                .exec((err, found_genre) => {
                    if (err) { return next (err)}
                    if (found_genre) {
                        res.redirect(found_genre.url)
                    }
                    else {
                        genre.save(err => {
                            if (err) { return next(err)}
                            // genre saced. Redirect
                            res.redirect(genre.url)
                        })
                    }
                })
        }

    }
]

// Display Genre delete form on GET
exports.genre_delete_get = (req, res, next) => {
    
    async.parallel({
        genre: callback => Genre.findById(req.params.id).exec(callback),
        books: callback => Book.find({ 'genre' : req.params.id}).exec(callback)
    },  (err, results) => {
            if (err) { return next(err)}
            if (results.genre==null) {
                // No results
                res.redirect('/catalog/genres')
            }
            // Succesful
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, books: results.books})  
    })  
}
// HandleGenre edelete on POST
exports.genre_delete_post = (req, res, next) => {
    
    async.parallel({
        genre: callback => Genre.findById(req.body.genreid).exec(callback),
        books: callback => Book.find({ 'genre' : req.body.genreid}).exec(callback)
    }, (err, results) => {
            if (err) {return next(err)}
            // Success
            if (results.books.length > 0) {
                // Book has bookinstances!
                
                res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, books: results.books}) 
                return
            }
            else {
                // Book has no instances. Delete object and redirect
                Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                    if (err) { return next(err)}
                    // Success
                    res.redirect('/catalog/genres')
                })
                
            }
    })
    
}
// Display Genre update form on GET
exports.genre_update_get = (req, res, next) => {
    
    // Get author details
    Genre.findById(req.params.id).exec((err, genre) => {
            if (err) { return next(err)}
            if (genre==null) {
                var err = new Error('Genre not found')
                err.status = 404
                return next(err)
            }
            // Success
            //console.log("Birth Date", author.date_of_birth)
            res.render('genre_form', {title: 'Update Genre', genre: genre})
    })
}
// Handle Genre update on POST
exports.genre_update_post = [
    // Validate and sanitize the name field.
    body('name', 'Genre name required').trim().isLength({ min: 1}).escape(),

    // process request after validation and sanitization.
    (req, res, next) => {
        // extract the validation errors from a request.
        const errors = validationResult(req)
        // create a genre object with escaped and trimmed data.
        

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Create Genre', genre, errors: errors.array()})
            return
        } else {
            var genre = new Genre( {
                name: req.body.name,
                _id: req.params.id  
                })
             //Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
                if (err) { return next(err)}
                // Successful
                res.redirect(thegenre.url)
            })
        }

    }

] 