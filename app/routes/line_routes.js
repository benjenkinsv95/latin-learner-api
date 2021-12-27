// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for lines
const Line = require('../models/line')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { line: { title: '', text: 'foo' } } -> { line: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /lines
router.get('/lines', requireToken, (req, res, next) => {
  Line.find()
    // respond with status 200 and JSON of the lines
    .then(lines => res.status(200).json({ lines: lines }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /lines/5a7db6c74d55bc51bdf39793
router.get('/lines/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Line.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "line" JSON
    .then(line => res.status(200).json({ line: line }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /lines
router.post('/lines', requireToken, (req, res, next) => {
  // set owner of new line to be current user
  req.body.line.owner = req.user.id

  Line.create(req.body.line)
    // respond to succesful `create` with status 201 and JSON of new "line"
    .then(line => {
      res.status(201).json({ line })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /lines/5a7db6c74d55bc51bdf39793
router.patch('/lines/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.line.owner

  Line.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the line's owner (line.owner)
    .then(line => requireOwnership(req, line))
    // updating line object with lineData
    .then(line => line.updateOne(req.body.line))
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /lines/5a7db6c74d55bc51bdf39793
router.delete('/lines/:id', requireToken, (req, res, next) => {
  Line.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the line's owner (line.owner)
    .then(line => requireOwnership(req, line))
    // delete line from mongodb
    .then(line => line.deleteOne())
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
