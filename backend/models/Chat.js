const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const messageSchema = new Schema({
  text: String,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  image: { imageType: { type: String }, data: { type: Buffer } },
  time_stamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

const chatSchema = new Schema({
  messages: [ { type: Schema.Types.ObjectId, ref: 'Message' } ],
  users: [ { type: Schema.Types.ObjectId, ref: 'User' } ],
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  last_message: { type: Date, default: Date.now() },
});

const groupSchema = new Schema({
  name: { type: String, required: true},
  description: { type: String, default: ''},
  image: { imageType: { type: String }, data: { type: Buffer } },
  messages: [ { type: Schema.Types.ObjectId, ref: 'Message'}],
  users: [ { type: Schema.Types.ObjectId, ref: 'User'}],
  last_message: { type: Date, default: Date.now() },
  admins: [ { type: Schema.Types.ObjectId, ref: 'User'}],
  owner: { type: Schema.Types.ObjectId, ref: 'User'},
});

const Chat = mongoose.model('Chat', chatSchema);
const Group = mongoose.model('Group', groupSchema);

module.exports = { Message, Chat, Group};