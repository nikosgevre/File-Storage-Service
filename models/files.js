const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const fileSchema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: String, required: true },
  timestamp: { type: String, required: true },
  type: { type: String, required: true },
  mimetype: { type: String, required: true },
  userpath: { type: String, required: false },

  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
});

module.exports = mongoose.model('File', fileSchema);