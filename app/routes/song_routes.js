// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for songs
const Song = require('../models/song')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { song: { title: '', text: 'foo' } } -> { song: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /songs
router.get('/songs', (req, res, next) => {
  Song.find()
    // respond with status 200 and JSON of the songs
    .then(songs => res.status(200).json({ songs: songs }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /songs/5a7db6c74d55bc51bdf39793
router.get('/songs/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Song.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "song" JSON
    .then(song => res.status(200).json({ song: song }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /songs
router.post('/songs', requireToken, (req, res, next) => {
  // set owner of new song to be current user
  req.body.song.owner = req.user.id

  Song.create(req.body.song)
    // respond to succesful `create` with status 201 and JSON of new "song"
    .then(song => {
      res.status(201).json({ song })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /songs/5a7db6c74d55bc51bdf39793
router.patch('/songs/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.song.owner

  Song.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the song's owner (song.owner)
    .then(song => requireOwnership(req, song))
    // updating song object with songData
    .then(song => song.updateOne(req.body.song))
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /songs/5a7db6c74d55bc51bdf39793
router.delete('/songs/:id', requireToken, (req, res, next) => {
  Song.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the song's owner (song.owner)
    .then(song => requireOwnership(req, song))
    // delete song from mongodb
    .then(song => song.deleteOne())
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
