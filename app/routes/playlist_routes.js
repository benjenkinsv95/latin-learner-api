// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for playlists
const Playlist = require('../models/playlist')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { playlist: { title: '', text: 'foo' } } -> { playlist: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /playlists
router.get('/playlists', (req, res, next) => {
  Playlist.find()
    .populate('songs')
    // respond with status 200 and JSON of the playlists
    .then(playlists => res.status(200).json({ playlists: playlists }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /playlists/5a7db6c74d55bc51bdf39793
router.get('/playlists/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Playlist.findById(req.params.id)
    .populate('songs')
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "playlist" JSON
    .then(playlist => res.status(200).json({ playlist: playlist }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /playlists
router.post('/playlists', requireToken, (req, res, next) => {
  // set owner of new playlist to be current user
  req.body.playlist.owner = req.user.id

  Playlist.create(req.body.playlist)
    // respond to succesful `create` with status 201 and JSON of new "playlist"
    .then(playlist => {
      res.status(201).json({ playlist })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /playlists/5a7db6c74d55bc51bdf39793
router.patch('/playlists/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.playlist.owner

  Playlist.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the playlist's owner (playlist.owner)
    .then(playlist => requireOwnership(req, playlist))
    // updating playlist object with playlistData
    .then(playlist => playlist.updateOne(req.body.playlist))
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /playlists/5a7db6c74d55bc51bdf39793
router.delete('/playlists/:id', requireToken, (req, res, next) => {
  Playlist.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the playlist's owner (playlist.owner)
    .then(playlist => requireOwnership(req, playlist))
    // delete playlist from mongodb
    .then(playlist => playlist.deleteOne())
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
