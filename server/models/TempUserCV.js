const mongoose = require('mongoose');

const tempUserCVSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  // Optional TTL via expiresAt; if you configure a TTL index, Mongo will purge automatically
  expiresAt: { type: Date, default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), index: { expires: '7d' } }
});

module.exports = mongoose.model('TempUserCV', tempUserCVSchema);


