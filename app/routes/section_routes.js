// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for sections
const Section = require('../models/section')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { section: { title: '', text: 'foo' } } -> { section: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /sections
router.get('/sections', requireToken, (req, res, next) => {
  Section.find()
    // respond with status 200 and JSON of the sections
    .then(sections => res.status(200).json({ sections: sections }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /sections/5a7db6c74d55bc51bdf39793
router.get('/sections/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Section.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "section" JSON
    .then(section => res.status(200).json({ section: section }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /sections
router.post('/sections', requireToken, (req, res, next) => {
  // set owner of new section to be current user
  req.body.section.owner = req.user.id

  Section.create(req.body.section)
    // respond to succesful `create` with status 201 and JSON of new "section"
    .then(section => {
      res.status(201).json({ section })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /sections/5a7db6c74d55bc51bdf39793
router.patch('/sections/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.section.owner

  Section.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the section's owner (section.owner)
    .then(section => requireOwnership(req, section))
    // updating section object with sectionData
    .then(section => section.updateOne(req.body.section))
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /sections/5a7db6c74d55bc51bdf39793
router.delete('/sections/:id', requireToken, (req, res, next) => {
  Section.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the section's owner (section.owner)
    .then(section => requireOwnership(req, section))
    // delete section from mongodb
    .then(section => section.deleteOne())
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
