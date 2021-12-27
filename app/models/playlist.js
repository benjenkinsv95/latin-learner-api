const mongoose = require('mongoose')
// eslint-disable-next-line no-unused-vars
const Song = require('./song')

const playlistSchema = new mongoose.Schema(
  {
    // ex. 'Beginner Latin'
    name: { type: String, required: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Playlist', playlistSchema)
