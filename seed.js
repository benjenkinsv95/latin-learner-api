const mongoose = require('mongoose')

const Line = require('./app/models/line')
const Section = require('./app/models/section')
const Song = require('./app/models/song')
const Playlist = require('./app/models/playlist')
const fortuna = require('./app/data/fortuna')
const priam = require('./app/data/aeneid-priam')

// require database configuration logic
// `db` will be the actual Mongo URI as a string
const config = require('./config/db')

// establish database connection
// use new version of URL parser
// use createIndex instead of deprecated ensureIndex
mongoose.connect(config, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', () => {
  const seedSongs = [fortuna, priam]

  const owner = '61c8fefa518a92216500bf58'
  seedSongs.forEach(song => { song.owner = owner })

  Song.find()
    .then(songs => songs.forEach(song => song.deleteOne()))
  Playlist.find().then(playlists => playlists.forEach(playlist => playlist.deleteOne()))

  const songDocuments = []
  Song.create(fortuna)
    .then(song => songDocuments.push(song))
    .then(() => Song.create(priam))
    .then(song => {
      songDocuments.push(song)

      return Playlist.create({
        name: 'First Playlist',
        songs: songDocuments,
        owner
      })
    })
    .then(console.log)
    .catch(console.error)
    .finally(() => db.close())
})
