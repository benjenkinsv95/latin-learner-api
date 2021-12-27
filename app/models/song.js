const mongoose = require('mongoose')
const Section = require('./section')

const songSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    artist: { type: String, required: true },
    youtubeChannel: { type: String, required: true },
    youtubeId: { type: String, required: true },
    // ex. 'latin'
    sourceLanguage: { type: String, required: true },
    // ex. 'english'
    translationLanguage: { type: String, required: true },
    sections: [{ type: Section.schema, required: true }],
    type: { type: String, default: 'song' },
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

module.exports = mongoose.model('Song', songSchema)
