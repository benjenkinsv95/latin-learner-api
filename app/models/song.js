const mongoose = require('mongoose')
const Section = require('./section')

const songSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // ex. intro, verse, chorus, bridge, outro
    videoUrl: { type: String, required: true },
    // ex. 'latin'
    sourceLanguage: { type: String, required: true },
    // ex. 'english'
    translationLanguage: { type: String, required: true },
    sections: [{ type: Section.schema, required: true }],
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
