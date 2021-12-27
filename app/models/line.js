const mongoose = require('mongoose')

const lineSchema = new mongoose.Schema(
  {
    // ex. velut luna
    source: { type: String, required: true },
    // ex. like the moon
    translation: { type: String, required: true },
    // ex. like a moon
    alternateTranslation: { type: String },
    minutesTimestamp: { type: Number, required: true, min: 0, max: 59 },
    secondsTimestamp: { type: Number, required: true, min: 0, max: 59 }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Line', lineSchema)
