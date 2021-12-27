const mongoose = require('mongoose')
const Line = require('./line')

const sectionSchema = new mongoose.Schema(
  {
    // ex. intro, verse, chorus, bridge, outro
    name: { type: String, default: '' },
    lines: [{ type: Line.schema, required: true }]
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Section', sectionSchema)
