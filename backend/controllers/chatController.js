const mongoose = require("mongoose");
const { Chat, Message, Group } = require("../models/Chat");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const { User, MessageHistory } = require("../models/User");
require("dotenv").config();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are accepted"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

// DIRECTS

exports.chat_create_direct = async (req, res, next) => {
  const userId = req.user._id;
  const userTwoId = req.params.id;

  if (!mongoose.isValidObjectId(userTwoId)) {
    return res.json({
      success: false,
      error: "User not found: Not valid ObjectID",
    });
  }

  try {
    const [userOne, userTwo, userOneMessageHistory, alreadyHaveChat] =
      await Promise.all([
        User.findById(userId).exec(),
        User.findById(userTwoId).exec(),
        MessageHistory.findOne({ user: userId }).exec(),
        Chat.findOne({ users: { $all: [userId, userTwoId] } }).exec(),
      ]);

    if (!userOne || !userTwo) {
      return res.json({
        success: false,
        error: "User not found",
      });
    }

    if (alreadyHaveChat) {
      const userOneHasChat = userOneMessageHistory.chats.some(
        (chat) => chat._id.toString() === alreadyHaveChat._id.toString()
      );

      if (userOneHasChat) {
        return res.status(400).json({
          success: false,
          error: "Already have a chat with this user",
        });
      }

      userOneMessageHistory.chats.push(alreadyHaveChat._id);
      await userOneMessageHistory.save();

      return res.json({
        success: true,
        message: "Chat added to your message history",
      });
    }

    const newChat = new Chat({
      messages: [],
      users: [userOne._id, userTwo._id],
      chat_type: "Direct",
    });
    await newChat.save();

    userOneMessageHistory.chats.push(newChat._id);
    await userOneMessageHistory.save();

    return res.json({
      success: true,
      message: "Chat created successfully",
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.chat_send_message = [
  body("text").trim().isString().escape().isLength({ min: 1 }),
  upload.single("image"),
  async (req, res, next) => {
    let newMessage;
    const userOneId = req.user._id;
    const userTwoId = req.params.id;
    const [userOneMessageHistory, userTwoMessageHistory, chatAlreadyExists] =
      await Promise.all([
        MessageHistory.findOne({ user: userOneId }).populate("chats"),
        MessageHistory.findOne({ user: userTwoId }).populate("chats"),
        Chat.find({ users: { $all: [userOneId, userTwoId] } }),
      ]);
    const { text } = req.body;
    const image = req.file;
    if (image) {
      newMessage = new Message({
        text: text,
        user: req.user._id,
        image: { imageType: image.mimetype, data: image.buffer },
        last_message: Date.now(),
      });
    } else {
      newMessage = new Message({
        text: text,
        user: req.user._id,
        last_message: Date.now(),
      });
    }
    try {
      if (chatAlreadyExists.length === 0) {
        const newChatOne = new Chat({
          messages: [newMessage],
          users: [userOneId, userTwoId],
          owner: userOneId,
          last_message: Date.now(),
        });
        const newChatTwo = new Chat({
          messages: [newMessage],
          users: [userOneId, userTwoId],
          owner: userTwoId,
          last_message: Date.now(),
        });
        userOneMessageHistory.chats.push(newChatOne);
        userTwoMessageHistory.chats.push(newChatTwo);
        await Promise.all([newChatOne.save(), newChatTwo.save()]);
      } else if (chatAlreadyExists.length === 1) {
        const userOneChat = userOneMessageHistory.chats.find((chat) =>
          chat.users.some((user) => user.equals(userTwoId))
        );
        const userTwoChat = userTwoMessageHistory.chats.find((chat) =>
          chat.users.some((user) => user.equals(userOneId))
        );
        if (userOneChat === undefined) {
          const newChat = new Chat({
            messages: [newMessage],
            users: [userOneId, userTwoId],
            owner: userOneId,
            last_message: Date.now(),
          });
          userTwoChat.messages.push(newMessage);
          userTwoChat.last_message = Date.now();
          userOneMessageHistory.chats.push(newChat);
          await Promise.all([newChat.save(), userTwoChat.save()]);
        }
        if (userTwoChat === undefined) {
          const newChat = new Chat({
            messages: [newMessage],
            users: [userOneId, userTwoId],
            owner: userTwoId,
            last_message: Date.now(),
          });
          userOneChat.messages.push(newMessage);
          userOneChat.last_message = Date.now();
          userTwoMessageHistory.chats.push(newChat);
          await Promise.all([newChat.save(), userOneChat.save()]);
        }
      } else if (chatAlreadyExists.length === 2) {
        const userOneChat = userOneMessageHistory.chats.find((chat) =>
          chat.users.some((user) => user.equals(userTwoId))
        );
        const userTwoChat = userTwoMessageHistory.chats.find((chat) =>
          chat.users.some((user) => user.equals(userOneId))
        );
        userOneChat.messages.push(newMessage);
        userOneChat.last_message = Date.now();
        userTwoChat.messages.push(newMessage);
        userTwoChat.last_message = Date.now();
        await Promise.all([userOneChat.save(), userTwoChat.save()]);
      }

      await Promise.all([
        newMessage.save(),
        userOneMessageHistory.save(),
        userTwoMessageHistory.save(),
      ]);

      return res.json({
        success: true,
        message: "Message succesfully created.",
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
];

exports.chats_get_from_user = async (req, res, next) => {
  const limit = req.query.limit;
  try {
    const chatsFromUser = await Chat.find({
      owner: { $in: req.user._id },
    })
      .populate([
        {
          path: "messages",
          select: "-image.data",
          options: { sort: { time_stamp: -1 }, limit: 4 },
        },
        {
          path: "users",
          select: "name username profile",
          populate: {
            path: "profile",
            select:
              "-profile_picture.data -profile_thumbnail -description -_id",
          },
        },
      ])
      .limit(limit !== undefined ? limit : 0);
    if (!chatsFromUser) {
      return res.json({ success: false, error: "User chats not found" });
    }
    return res.json({ success: true, chats: chatsFromUser });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
};

exports.chat_get_single = async (req, res, next) => {
  const userId = req.user._id;
  const chatId = req.params.id;
  if (!mongoose.isValidObjectId(chatId)) {
    return res.json({ success: false, error: "Invalid chat id." });
  }
  try {
    const chat = await Chat.findOne({ _id: chatId }).populate([
      { path: "messages", select: "-image.data" },
      {
        path: "users",
        select: "name username profile",
        populate: {
          path: "profile",
          select: "-profile_picture.data -profile_thumbnail",
        },
      },
    ]);
    if (chat) {
      if (chat.owner.toString() !== userId.toString()) {
        return res.json({
          success: false,
          error: "This chat don't belong to you.",
        });
      }
      return res.json({ success: true, chat });
    } else {
      return res.json({ success: false, error: "Chat not found." });
    }
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
};

exports.chat_get_single_by_user = async (req, res, next) => {
  const userId = req.user._id;
  const oUserId = req.params.id;
  if (!mongoose.isValidObjectId(oUserId)) {
    return res.json({ success: false, error: "Invalid chat id." });
  }
  try {
    const chat = await Chat.findOne({ users: {$all: [userId, oUserId] }, owner: userId}).populate([
      { path: "messages", select: "-image.data" },
      {
        path: "users",
        select: "name username profile",
        populate: {
          path: "profile",
          select: "-profile_picture.data -profile_thumbnail",
        },
      },
    ]);
    if (chat) {
      if (chat.owner.toString() !== userId.toString()) {
        return res.json({
          success: false,
          error: "This chat don't belong to you.",
        });
      }
      return res.json({ success: true, chat });
    } else {
      const oUser = await User.findById(oUserId).populate({ path: "profile", select: "-profile_picture.data -profile_thumbnail" });
      const user = await User.findById(userId).populate({ path: "profile", select: "-profile_picture.data -profile_thumbnail" });
      const newChat = {
        messages: [],
        users: [user, oUser],
        owner: userId,
        last_message: new Date(),
      };
      return res.json({ success: true, chat: newChat });
    }
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
}

exports.chat_delete_message_for_all = async (req, res, next) => {
  const messageId = req.params.id;
  if (!mongoose.isValidObjectId(messageId)) {
    return res.status(400).json({
      success: false,
      error: "Message not found: Invalid Object ID.",
    });
  }
  try {
    const message = await Message.findById(messageId);
    const chats = await Chat.find({ messages: message });
    let allowed = [];
    chats.forEach((chat) => {
      if (!chat.users.includes(req.user._id)) {
        allowed.push(false);
      } else {
        allowed.push(true);
      }
    });
    if (allowed.includes(false)) {
      return res.status(400).json({
        success: false,
        error: "You are not allowed to do this action.",
      });
    }
    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found.",
      });
    }
    if (!chats) {
      return res.status(404).json({
        success: false,
        error: "No chat found.",
      });
    }
    chats.forEach(async (chat) => {
      chat.messages = chat.messages.filter(
        (message) => message.toString() !== messageId.toString()
      );
      await chat.save();
    });
    await Message.findByIdAndDelete(message._id);
    return res.json({ success: true, message: "Message succesfully deleted." });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.chat_delete_message_for_user = async (req, res, next) => {
  const chatId = req.params.chatId;
  const messageId = req.params.messageId;
  if (
    !mongoose.isValidObjectId(messageId) ||
    !mongoose.isValidObjectId(chatId)
  ) {
    return res
      .status(400)
      .json({ success: false, error: "Message not found: Invalid Object ID." });
  }
  try {
    const [message, chat] = await Promise.all([
      Message.findById(messageId),
      Chat.findById(chatId),
    ]);
    if (!chat.users.includes(req.user._id.toString()))
      return res.status(400).json({
        success: false,
        error: "You are not allowed to do this action.",
      });
    if (!message) {
      return res
        .status(404)
        .json({ success: false, error: "Message not found." });
    }
    if (!chat) {
      return res.status(404).json({ success: false, error: "Chat not found." });
    }
    chat.messages = chat.messages.filter(
      (message) => message.toString() !== messageId.toString()
    );
    await chat.save();
    return res.json({
      success: true,
      message: "Message deleted succesfully.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.chat_messages_empty = async (req, res, next) => {
  const chatId = req.params.chatId;
  if (!mongoose.isValidObjectId(chatId))
    return res
      .status(400)
      .json({ success: false, error: "Chat not found: Not valid Object ID." });
  try {
    const chat = await Chat.findById(chatId);
    if (!chat.users.includes(req.user._id.toString()))
      return res.status(400).json({
        success: false,
        error: "You are not allowed to do this action.",
      });
    chat.messages = [];
    await chat.save();
    res.json({
      success: true,
      message: "All messages from chat deleted.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.chat_delete_for_all = async (req, res, next) => {
  const userId = req.params.userId;
  console.log(userId);
  if (!mongoose.isValidObjectId(userId))
    return res.status(400).json({
      success: false,
      error: "Not found: Invalid Object ID",
    });
  try {
    const [chatUserOne, chatUserTwo] = await Promise.all([
      Chat.findOne({
        users: { $all: [req.user._id, userId] },
        owner: req.user._id,
      }),
      Chat.findOne({ users: { $all: [req.user._id, userId] }, owner: userId }),
    ]);
    if (chatUserOne === undefined || chatUserTwo === undefined) {
      return res.status(404).json({
        success: false,
        error: "Chat not found.",
      });
    }
    const [userOneMessageHistory, userTwoMessageHistory] = await Promise.all([
      MessageHistory.findOne({ user: req.user._id.toString() }).populate(
        "chats"
      ),
      MessageHistory.findOne({ user: userId.toString() }).populate("chats"),
    ]);

    let allowed = false;
    if (
      !chatUserOne.users.includes(req.user._id && userId) ||
      !chatUserTwo.users.includes(req.user._id && userId)
    ) {
      allowed = false;
    } else {
      allowed = true;
    }
    if (!allowed) {
      return res.status(400).json({
        success: false,
        error: "You are not allowed to do this action.",
      });
    }
    let allMessages = [];
    chatUserOne.messages.forEach((message) => {
      allMessages.includes(message.toString())
        ? null
        : allMessages.push(message.toString());
    });
    chatUserTwo.messages.forEach((message) => {
      allMessages.includes(message.toString())
        ? null
        : allMessages.push(message.toString());
    });
    userOneMessageHistory.chats = userOneMessageHistory.chats.filter(
      (chat) => chat._id.toString() !== chatUserOne._id.toString()
    );
    userTwoMessageHistory.chats = userTwoMessageHistory.chats.filter(
      (chat) => chat._id.toString() !== chatUserTwo._id.toString()
    );
    await Promise.all([
      userOneMessageHistory.save(),
      userTwoMessageHistory.save(),
      Chat.findByIdAndDelete(chatUserOne._id),
      Chat.findByIdAndDelete(chatUserTwo._id),
    ]);
    if (allMessages.length > 0) {
      await Message.deleteMany({ _id: { $in: allMessages } });
    }
    return res.json({
      sucess: true,
      message: "All messages and Chats deleted.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.chat_delete_for_user = async (req, res, next) => {
  const userId = req.params.userId;
  if (!mongoose.isValidObjectId(userId))
    return res
      .status(400)
      .json({ success: false, error: "Not found: Object ID not valid" });
  try {
    const userMessageHistory = await MessageHistory.findOne({
      user: req.user._id.toString(),
    }).populate("chats");
    const chat = userMessageHistory.chats.find((chat) =>
      chat.users.includes(userId.toString())
    );
    if (chat === undefined)
      return res
        .status(404)
        .json({ success: false, error: "Not found: Chat not found." });
    if (!chat.users.includes(req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        error: "You are not allowed to do this action.",
      });
    }
    userMessageHistory.chats = userMessageHistory.chats.filter(
      (x) => x._id.toString() !== chat._id.toString()
    );
    await Promise.all([
      Chat.findByIdAndDelete(chat._id),
      userMessageHistory.save(),
    ]);
    return res.json({
      success: true,
      message: "Chat succesfully deleted",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.clear_stray_messages = async (req, res) => {
  const password = req.params.password;
  if (password !== process.env.password_for_clear) {
    return res.status(400).json({
      success: false,
      error: "You are not allowed to do this action.",
    });
  }
  try {
    const messages = await Message.find({});
    messages.forEach(async (message) => {
      const messageHasChat = await Chat.findOne({
        messages: message._id.toString(),
      });
      const messageHasGroup = await Group.findOne({
        messages: message._id.toString(),
      });
      messageHasChat || messageHasGroup
        ? null
        : await Message.findByIdAndDelete(message._id.toString());
    });
    return res.json({ Message: "All stray messages deleted." });
  } catch (error) {
    console.log(error);
  }
};

// GROUPS

exports.group_create = [
  upload.single("image"),
  body("name", "Group name must have at least 1 character")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .isString(),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .escape()
    .isString(),
  body("users", "Users must be an array with valid users.")
    .isArray()
    .optional()
    .custom((value) => {
      if (value !== undefined) {
        value.forEach((user) => {
          if (!mongoose.isValidObjectId(user)) {
            throw new Error("Not valid ObjectID");
          }
        });
      }
      return true;
    }),
  async (req, res, next) => {
    const userId = req.user._id;
    const { name, description, users = [] } = req.body;
    const result = validationResult(req);
    const errors = result.errors;
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors: errors });
    }
    const usersId = [userId, ...users];
    try {
      const newGroup = new Group({
        name: name,
        description: description,
        messages: [],
        users: usersId,
        admins: userId,
        owner: userId,
      });
      if (req.file) {
        const thumbnail = await sharp(req.file.buffer)
          .resize(1000, 1000)
          .toBuffer();
        newGroup.image = { imageType: req.file.mimetype, data: thumbnail };
      }

      const usersMessageHistories = await MessageHistory.find({
        user: { $in: usersId },
      });

      if (usersMessageHistories.length !== usersId.length) {
        return res.status(400).json({
          success: false,
          error: "Not all users have message histories or some user not found.",
        });
      }

      const UMHPromises = usersMessageHistories.map((userMH) => {
        userMH.groups.push(newGroup._id);
        return userMH.save();
      });
      let nGId;
      await newGroup.save().then((nG) => (nGId = nG._id));
      await Promise.all(UMHPromises);

      return res.json({
        success: true,
        message: "Chat Group created successfully",
        group_id: nGId,
      });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
];

exports.group_change_info = [
  upload.single("image"),
  body("name", "Group name must have at least 1 character")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .isString(),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .escape()
    .isString(),
  async (req, res, next) => {
    const groupId = req.params.groupId;
    const { name, description } = req.body;
    const result = validationResult(req);
    const errors = result.array();
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors: errors });
    }
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res
          .status(404)
          .json({ success: false, error: "Group not found" });
      }
      if (!group.admins.includes(req.user._id.toString())) {
        return res.status(400).json({
          success: false,
          error: "You are not allowed to do this action.",
        });
      }
      if (name) {
        group.name = name;
      }
      if (description) {
        group.description = description;
      }
      if (req.file) {
        const thumbnail = await sharp(req.file.buffer)
          .resize(1000, 1000)
          .toBuffer();
        group.image = { imageType: req.file.mimetype, data: thumbnail };
      }
      await group.save();
      return res.json({
        success: true,
        message: "Group edited succesfully.",
      });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
];

exports.groud_admins_add = async (req, res, next) => {
  const groupId = req.params.id;
  const userIdToAdd = req.params.userId;

  !mongoose.isValidObjectId(groupId) &&
    res.status(400).json({
      success: false,
      error: "Not valid ObjectID",
    });
  !mongoose.isValidObjectId(userIdToAdd) &&
    res.status(400).json({
      success: false,
      error: "Not valid ObjectID",
    });

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }
    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "Only group owner can add admins",
      });
    }
    if (!group.admins.includes(userIdToAdd)) {
      group.admins.push(userIdToAdd);
      await group.save();
      return res.json({
        success: true,
        message: "Admin added successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "User is already an admin",
      });
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.groud_admins_remove = async (req, res, next) => {
  const groupId = req.params.id;
  const userIdToAdd = req.params.userId;

  !mongoose.isValidObjectId(groupId) &&
    res.status(400).json({
      success: false,
      error: "Not valid ObjectID",
    });
  !mongoose.isValidObjectId(userIdToAdd) &&
    res.status(400).json({
      success: false,
      error: "Not valid ObjectID",
    });

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }
    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "Only group owner can remove admins",
      });
    }
    if (group.owner.toString() === userIdToAdd.toString()) {
      return res.status(400).json({
        success: false,
        error: "Cannot remove owner from admins",
      });
    }
    if (group.admins.includes(userIdToAdd)) {
      group.admins = group.admins.filter(
        (admin) => admin.toString() !== userIdToAdd
      );
      await group.save();
      return res.json({
        success: true,
        message: "Admin removed successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "User is not an admin",
      });
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.group_users_add = [
  body("users")
    .isArray({ min: 1 })
    .withMessage("Users must be an array with at least one user.")
    .isLength({ min: 1 })
    .custom((value) => {
      value.forEach((user) => {
        if (!mongoose.isValidObjectId(user)) {
          throw new Error("Not valid ObjectID");
        }
      });
      return true;
    }),
  async (req, res, next) => {
    const groupId = req.params.id;
    const usersToAdd = req.body.users;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({
        success: false,
        error: "Group not found: Not valid ObjectID",
      });
    }

    try {
      const group = await Group.findById(groupId);
      const user = await User.findById(userId);

      if (!group) {
        return res.status(404).json({
          success: false,
          error: "Group not found",
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      if (!group.admins.includes(user._id)) {
        return res.status(403).json({
          success: false,
          error: "You are not allowed to do this action.",
        });
      }

      for (const userToAdd of usersToAdd) {
        if (group.users.includes(userToAdd)) {
          return res.status(400).json({
            success: false,
            error: `User already added.`,
          });
        }
      }

      group.users = [...group.users, ...usersToAdd];
      await group.save();

      return res.json({
        success: true,
        message: "Users added successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
];

exports.group_user_add = [
  body("username")
    .isString()
    .custom(async (u) => {
      const user = await User.findOne({ username: u });
      if (!user) throw new Error("User does not exist.");
    }),
  async (req, res, next) => {
    const body = req.body.username;
    const groupId = req.params.id;
    const result = validationResult(req);
    const errors = result.array();

    if (!mongoose.isValidObjectId(groupId))
      return res
        .status(404)
        .json({ success: false, error: "Group not found: Invalid Object Id." });
    if (errors.length > 0) return res.json({ success: false, errors });

    const group = await Group.findById(groupId).select("users admins");
    const user = await User.findOne({ username: body })
      .select("name username profile")
      .populate({
        path: "profile",
        select: "-profile_picture.data -profile_thumbnail -description",
      });

    if (!group.admins.includes(req.user._id))
      return res
        .status(400)
        .json({ message: "You are not allowed to do this action." });
    if (group.users.includes(user._id))
      return res.json({ success: false, error: "User is already a member." });

    group.users.push(user);

    await group
      .save()
      .then((u) => {
        return res.json({
          success: true,
          message: "New member added successfully.",
          user: user,
        });
      })
      .catch((e) => {
        return res.json({ success: false, error: e.message });
      });
  },
];

exports.group_user_remove = [
  body("username")
    .isString()
    .custom(async (u) => {
      const user = await User.findOne({ username: u });
      if (!user) throw new Error("User does not exist.");
    }),
  async (req, res, next) => {
    const body = req.body.username;
    const groupId = req.params.id;
    const result = validationResult(req);
    const errors = result.array();

    if (!mongoose.isValidObjectId(groupId))
      return res
        .status(404)
        .json({ success: false, error: "Group not found: Invalid Object Id." });
    if (errors.length > 0) return res.json({ success: false, errors });

    const group = await Group.findById(groupId).select("users admins");
    const user = await User.findOne({ username: body });

    if (!group.admins.includes(req.user._id))
      return res
        .status(400)
        .json({
          success: false,
          message: "You are not allowed to do this action.",
        });
    if (!group.users.includes(user._id))
      return res.json({
        success: false,
        error: "User is not a member of this group.",
      });

    group.users = group.users.filter(
      (u) => u._id.toString() !== user._id.toString()
    );

    await group
      .save()
      .then((u) => {
        return res.json({
          success: true,
          message: "Member succesfully removed.",
        });
      })
      .catch((e) => {
        return res.json({ success: false, error: e.message });
      });
  },
];

exports.group_users_remove = [
  body("user")
    .isObject()
    .custom((user) => {
      if (!mongoose.isValidObjectId(user)) {
        throw new Error("Invalid ObjectId");
      }
      return true;
    }),
  async (req, res, next) => {
    const groupId = req.params.id;
    const userId = req.user._id;
    const userToRemoveId = req.body.user;

    try {
      const group = await Group.findById(groupId);
      const userToRemove = await User.findById(userToRemoveId);

      if (!userToRemove) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      if (!group) {
        return res.status(404).json({
          success: false,
          error: "Group not found",
        });
      }

      if (group.owner.toString() === userToRemoveId.toString()) {
        return res.status(400).json({
          success: false,
          error: "Cannot remove owner from group.",
        });
      }

      if (group.owner.toString() !== userId.toString()) {
        if (group.admins.includes(userId)) {
          return res.status(400).json({
            success: false,
            error: "Cannot remove admin from group.",
          });
        }
      } else {
        if (group.admins.includes(userToRemoveId.toString())) {
          group.admins = group.admins.filter(
            (admin) => admin.toString() !== userToRemoveId.toString()
          );
        }
      }

      if (!group.admins.includes(req.user._id.toString())) {
        return res.status(403).json({
          success: false,
          error: "You are not allowed to do this action.",
        });
      }

      if (!group.users.includes(req.user._id.toString())) {
        return res.status(403).json({
          success: false,
          error: "You are not allowed to do this action.",
        });
      }

      if (!group.users.includes(userToRemove._id)) {
        return res.status(400).json({
          success: false,
          error: "User is not in group",
        });
      }

      const usersInGroup = group.users.filter(
        (u) => u.toString() !== userToRemoveId.toString()
      );

      group.users = usersInGroup;

      await group.save();

      return res.json({
        success: true,
        message: "User removed successfully",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
];

exports.group_user_exit = async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;
  if (!mongoose.isValidObjectId(groupId))
    return res
      .status(404)
      .json({ success: false, error: "Group not found: Invalid Object Id." });

  const group = await Group.findById(groupId).select(
    "name admins owner users messages"
  );
  if (!group)
    return res.status(404).json({ success: false, error: "Group not found." });
  const user = await User.findById(userId).select(
    "name username message_history"
  );
  if (!user)
    return res.status(404).json({ success: false, error: "User not found." });
  const userMessageHistory = await MessageHistory.findById(
    user.message_history
  ).select("groups");
  if (!userMessageHistory)
    return res
      .status(404)
      .json({ success: false, error: "User message history not found." });

  let groupUsersNew = group.users.filter(
    (u) => u.toString() !== userId.toString()
  );
  if (groupUsersNew.length < 1) {
    const groupMessages = group.messages;
    await Message.deleteMany({ _id: { $in: groupMessages } });
    await Group.findByIdAndDelete(groupId);
    let userMessageHistoryGroupsModified = userMessageHistory.groups.filter(
      (g) => g.toString() !== groupId.toString()
    );
    userMessageHistory.groups = userMessageHistoryGroupsModified;
    await userMessageHistory.save();
    return res.json({
      success: true,
      message: "Group deleted.",
      userMessageHistoryGroupsModified,
    });
  }
  group.users = groupUsersNew;
  if (group.admins.includes(user._id)) {
    let groupAdminsNew;
    groupAdminsNew = group.admins.filter(
      (a) => a.toString() !== user._id.toString()
    );
    group.admins = groupAdminsNew;
  }
  if (group.owner.toString() === user._id.toString())
    group.owner = groupUsersNew[0];
  if (group.admins.length < 1) group.admins.push(groupUsersNew[0]);
  userMessageHistory.groups = userMessageHistory.groups.filter(
    (g) => g.toString() !== groupId.toString()
  );

  await Promise.all([group.save(), userMessageHistory.save()]);

  return res.json({
    success: true,
    message: `You left ${group.name} successfully.`,
  });
};

exports.group_send_message = [
  upload.single("image"),
  body("text").trim().isLength({ min: 1 }).escape().isString(),
  async (req, res, next) => {
    const userId = req.user._id;
    const groupId = req.params.groupId;
    const text = req.body.text;
    const result = validationResult(req);
    const errors = result.array();

    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({
        success: false,
        error: "Group not found: Invalid Object ID",
      });
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors,
      });
    }
    let newMessage;
    if (req.file) {
      newMessage = new Message({
        text: text.trim(),
        user: userId,
        image: { imageType: req.file.mimetype, data: req.file.buffer },
        time_stamp: Date.now(),
      });
    } else {
      newMessage = new Message({
        text: text.trim(),
        user: userId,
        time_stamp: Date.now(),
      });
    }

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: "Group not found.",
        });
      }
      if (!group.users.includes(userId.toString())) {
        return res.status(400).json({
          success: false,
          error: "You are not allowed to do this action.",
        });
      }

      group.messages.push(newMessage);
      group.last_message = Date.now();

      await Promise.all([group.save(), newMessage.save()]);

      return res.json({
        success: true,
        message: "Message sent succesfully",
      });
    } catch (error) {
      console.log(error);
      return res.json({
        success: false,
        error: error.message,
      });
    }
  },
];

exports.group_get_all_from_user = async (req, res, next) => {
  const userId = req.user._id;
  const limit = req.query.limit;
  try {
    const groups = await Group.find(
      { users: { $in: userId } },
      "-image.data -description"
    )
      .populate({
        path: "messages",
        select: "-image.data",
        populate: { path: "user", select: "name username" },
        options: { sort: { time_stamp: -1 }, limit: 4 },
      })
      .limit(limit !== undefined ? limit : 0);
    if (groups) {
      return res.json({ success: true, groups });
    } else {
      return res
        .status(404)
        .json({ success: false, error: "Groups not found" });
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.group_get_single = async (req, res, next) => {
  const groupId = req.params.groupid;
  if (!mongoose.isValidObjectId(groupId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid group ID",
    });
  }
  try {
    const group = await Group.findOne({ _id: groupId })
      .select("-image.data")
      .populate({
        path: "messages",
        select: "-image.data",
        populate: { path: "user", select: "name" },
      });
    if (!group) {
      return res.json({
        success: false,
        error: "Group not found.",
      });
    }
    if (!group.users.includes(req.user._id)) {
      return res.json({
        success: false,
        error: "You are not part of this group.",
      });
    }
    const usersInfo = await Group.findOne({ _id: groupId })
      .select("users -_id")
      .populate({
        path: "users",
        select: "name username profile",
        populate: {
          path: "profile",
          select: "-profile_picture.data -profile_thumbnail",
        },
      });
    const fullGroup = { ...group._doc, ["usersInfo"]: usersInfo.users };
    return res.json({
      success: true,
      group: fullGroup,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// GET IMAGES

exports.message_get_image = async (req, res, next) => {
  const messageId = req.params.id;
  if (!mongoose.isValidObjectId(messageId)) {
    return res
      .status(400)
      .json({ success: false, error: "Message not found: Not valid ObjectID" });
  }
  try {
    const message = await Message.findById(messageId);
    if (!message || !message.image) {
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    }
    res.set({
      "Content-Type": message.image.imageType,
    });
    res.send(message.image.data);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.group_get_thumbnail = async (req, res, next) => {
  const groupId = req.params.id;
  if (!mongoose.isValidObjectId(groupId)) {
    return res
      .status(400)
      .json({ success: false, error: "Group not found: Not valid ObjectID" });
  }
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    if (group.image.data === undefined) {
      return res
        .status(404)
        .json({ success: false, error: "Group has no thumbnail image" });
    }
    res.set({
      "Content-Type": group.image.imageType,
    });
    res.send(group.image.data);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};