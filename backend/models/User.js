const mongoose = require("mongoose");
const { Schema } = mongoose;
const moment = require("moment");
const { Message, Chat, Group } = require('../models/Chat');

const messageHistorySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  chats: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
});

const MessageHistory = mongoose.model('MessageHistory', messageHistorySchema);

const profileSchema = new Schema({
  profile_picture: { image_type: String, data: Buffer },
  profile_thumbnail: { image_type: String, data: Buffer },
  description: String,
});

const Profile = mongoose.model("Profile", profileSchema);

const userSchema = new Schema({
  name: { type: String, minLength: 3 },
  username: { type: String, minLength: 3, required: true },
  hash: { type: String, required: true },
  salt: { type: String, required: true },
  profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
  join_date: { type: Date },
  friends: [ {type: Schema.Types.ObjectId, ref: "User"} ],
  message_history: { type: Schema.Types.ObjectId, ref: "MessageHistory"}
});

const User = mongoose.model("User", userSchema);

module.exports = { User, Profile, MessageHistory };
