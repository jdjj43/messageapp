const mongoose = require("mongoose");
const { getSaltHash, checkPassword } = require("../utils/password");
const { User, Profile, MessageHistory } = require("../models/User");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { capitalize } = require("../utils/utilsFunctions");
const multer = require("multer");
const sharp = require("sharp");
const moment = require("moment");
require("dotenv").config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.user_create = [
  body("first_name", "Name must not be empty.")
    .escape()
    .isLength({ min: 3 })
    .trim()
    .isString(),
  body("last_name", "Last Name must not be empty.")
    .escape()
    .isLength({ min: 3 })
    .trim()
    .isString(),
  body("username", "Username must not be empty")
    .escape()
    .isLength({ min: 3 })
    .trim()
    .isString()
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        throw new Error("Username already in use.");
      }
    }),
  body(
    "password",
    "Password must contain at least 6 characters including letters and numbers, 1 uppercase and 1 symbol"
  )
    .isStrongPassword({
      minLength: 6,
      minUppercase: 1,
      minSymbols: 1,
    })
    .escape(),
  body("repeat_password", "Your passwords must be the same")
    .escape()
    .custom((value, { req }) => {
      return value === req.body.password;
    }),

  async (req, res, next) => {
    const result = validationResult(req);
    const errors = result.array();

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
      });
    }

    const { first_name, last_name, username, password } = req.body;
    const { salt, hash } = getSaltHash(password);

    try {
      const newProfile = new Profile({
        profile_picture: {
          image_type: "",
        },
        description: "",
      });
      const newUser = new User({
        name: `${capitalize(first_name)} ${capitalize(last_name)}`,
        username: username,
        hash: hash,
        salt: salt,
        profile: newProfile,
        join_date: Date.now(),
      });
      const newMessageHistory = new MessageHistory({
        user: newUser,
      });
      newUser.message_history = newMessageHistory;
      await newUser
        .save()
        .then(() => {
          newProfile.save();
          newMessageHistory.save();
        })
        .catch((err) => {
          console.log(err);
        });
      res.json({
        success: true,
        user: {
          ...newUser.toObject(),
          message_history: newMessageHistory._id,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        errors: [error.message],
      });
    }
  },
];

exports.user_edit = [
  body("first_name", "Name must contain atleast 3 characters.")
    .escape()
    .isLength({ min: 3 })
    .trim()
    .isString(),
  body("last_name", "Last Name must contain atleast 3 characters.")
    .escape()
    .isLength({ min: 3 })
    .trim()
    .isString(),
  body("username", "Username must contain atleast 3 characters.")
    .escape()
    .isLength({ min: 3 })
    .trim()
    .isString(),
  async (req, res, next) => {
    const userId = req.user._id;
    const { first_name, last_name, username } = req.body;
    try {
      const result = validationResult(req);
      const errors = result.array();
      if (errors.length > 0) {
        return res.json({
          success: false,
          error: errors,
        });
      }
      const user = await User.findOne(userId);
      const userByUsername = await User.findOne({ username: username });
      !user &&
        res.status(404).json({ success: false, error: "User not found." });
      if (userByUsername) {
        if (user.username !== userByUsername.username) {
          return res.status(400).json({
            success: false,
            error: "Username already in use.",
          });
        }
      }
      const editedUser = {
        name: `${capitalize(first_name)} ${capitalize(last_name)}`,
        username,
      };
      await User.findByIdAndUpdate(userId, editedUser);
      return res.json({
        success: true,
        message: "User edited succesfully.",
      });
    } catch (error) {
      return res.json({
        success: false,
        error: error,
      });
    }
  },
];

exports.user_login = [
  body("username", "A username is required.").isString().trim().escape(),
  body("password", "A password is required.").escape().isString(),
  async (req, res, next) => {
    const result = validationResult(req);
    const errors = result.array();

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        errors: errors,
      });
    }
    try {
      const { username, password } = req.body;
      const finduser = await User.findOne({ username: username });
      if (!finduser) {
        return res.status(400).json({
          success: false,
          error: ["User not found or wrong password"],
        });
      }
      if (checkPassword(password, finduser.salt, finduser.hash)) {
        const token = jwt.sign(
          { user: finduser, iat: Date.now() },
          process.env.secret,
          { expiresIn: "1d" }
        );
        return res.json({
          success: true,
          token: token,
          user: {
            name: finduser.name,
            username: finduser.username,
            join_date: moment(finduser.join_date).format("MMMM YYYY"),
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          error: ["User not found or wrong password"],
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error,
      });
    }
  },
];

exports.user_check_session = async (req, res, next) => {
  try {
    if(req.user) {
      const user = await User.findById(req.user._id, "-hash -salt -friends -message_history").populate([{ path: 'profile', select: 'image description profile_thumbnail -_id'}]).lean();
      if(user.profile.profile_thumbnail !== undefined) {
        const responseUser = {...user, profile: { ...user.profile, profile_thumbnail: { image_type: user.profile.profile_thumbnail.image_type}}};
        return res.json({ success: true, user: responseUser });
      }
      // console.log(responseUser.profile.profile_thumbnail !== undefined ? true : false);
      return res.json({ success: true, user });
    } else {
      return res.status(401).json({ success: false, error: ["No Session Found."] });
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.user_get_profile_info = async (req, res, next) => {
  const userId = req.params.id;
  !mongoose.isValidObjectId(userId) &&
    res
      .status(400)
      .json({ success: false, message: "User not found: Not valid ObjectID" });
  try {
    const user = await User.findOne(
      { _id: userId },
      "-salt -hash -message_history"
    ).populate("profile", "-profile_picture.data -profile_thumbnail");
    !user &&
      res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.user_get_full_info = async (req, res, next) => {
  const userId = req.params.id;
  !mongoose.isValidObjectId(userId) &&
    res.status(400).json({ success: false, error: "User not found: Invalid Object ID."});
  try {
    const user = await User.findById(userId, "-salt -hash").populate([{ path: 'profile', select: 'description profile_picture'}, { path: 'friends', select: 'name username join_date profile', populate: { path: 'profile', select: 'description' } }]);
    if(!user) {
      res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.user_get_info = async (req, res, next) => {
  const userId = req.params.id;
  !mongoose.isValidObjectId(userId) &&
    res
      .status(400)
      .json({ success: false, message: "User not found: Not valid ObjectID" });
  try {
    const user = await User.findOne(
      { _id: userId },
      "name username join_date friends"
    ).populate("friends", "name username join_date");
    !user &&
      res.status(404).json({ success: false, message: "User not found" });
    const userObj = user.toObject();
    const formatDate = moment(user.join_date).format("MMMM YYYY");
    userObj.join_date = formatDate;
    return res.json({
      success: true,
      user: userObj,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error });
  }
};

exports.user_edit_profile = [
  body("description").isString().trim().escape(),
  body("name").isString().trim().escape(),
  body("username").isString().trim().escape(),
  upload.single("profile_picture"),

  async (req, res, next) => {
    const { description, name, username } = req.body;
    console.log(req.body);
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.json({
          success: false,
          error: "User not found.",
        });
      }
      if (!req.file) {
        await Profile.findByIdAndUpdate(user.profile, {
          description: description,
        });
        await User.findByIdAndUpdate(user._id, {
          name: name,
          username: username,
        })
        return res.json({ success: true, message: "User updated" });
      }
      const thumbnail = await sharp(req.file.buffer)
        .resize(400, 400)
        .toBuffer();
      await Profile.findByIdAndUpdate(user.profile, {
        profile_picture: {
          image_type: req.file.mimetype,
          data: req.file.buffer,
        },
        profile_thumbnail: {
          image_type: req.file.mimetype,
          data: thumbnail,
        },
        description: description,
      });
      await User.findByIdAndUpdate(user._id, {
        name: name,
        username: username,
      })
      res.json({
        success: true,
        message: "Profile updated succesfully.",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error,
      });
    }
  },
];

exports.user_profile_delete_image = async (req, res) => {
  const id = req.user._id;
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found: User doesn't exists.",
      });
    }
    await Profile.findByIdAndUpdate(user.profile, {
      profile_picture: {},
      profile_thumbnail: {},
    });
    return res.json({ success: true, message: "Profile Picture deleted." });
  } catch (error) {}
};

exports.user_profile_image = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      error: "User not found: Invalid Object ID.",
    });
  }
  try {
    const user = await User.findOne({ _id: id }).populate("profile");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found: User doesn't exists.",
      });
    }
    if (
      user.profile.profile_picture.data === undefined &&
      user.profile.profile_picture.image_type === undefined
    ) {
      return res.status(404).json({
        success: false,
        error: "There's no profile image.",
      });
    }
    res.set("Content-Type", user.profile.profile_picture.image_type);
    res.send(user.profile.profile_picture.data);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error,
    });
  }
};

exports.user_profile_thumbnail = async (req, res, next) => {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      error: "User not found: Invalid Object ID.",
    });
  }
  try {
    const user = await User.findOne({ _id: id }).populate("profile");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found: User doesn't exists.",
      });
    }
    if (
      user.profile.profile_thumbnail.data === undefined &&
      user.profile.profile_thumbnail.image_type === undefined
    ) {
      return res.status(404).json({
        success: false,
        message: "There's no profile image.",
      });
    }
    res.set("Content-Type", user.profile.profile_thumbnail.image_type);
    res.send(user.profile.profile_thumbnail.data);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error,
    });
  }
};

exports.user_friends_add = async (req, res, next) => {
  const userId = req.user._id;
  const friendId = req.params.id;

  if (!mongoose.isValidObjectId(friendId)) {
    return res.status(400).json({
      success: false,
      error: "User not found: Object ID not valid.",
    });
  }

  try {
    const friend = await User.findById(friendId);
    const user = await User.findById(userId);
    if (friend) {
      if (user.friends.includes(friendId)) {
        return res.status(400).json({
          success: false,
          error: "Friend already added.",
        });
      }
      user.friends = [...user.friends, friend];
      await user.save();
      return res.json({
        success: true,
        message: "Friend added succesfully.",
      });
    } else {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error,
    });
  }
};

exports.user_friends_remove = async (req, res, next) => {
  const userId = req.user._id;
  const friendId = req.params.id;

  if (!mongoose.isValidObjectId(friendId)) {
    return res.json({
      success: false,
      error: "User not found: Not valid ObjectID",
    });
  }

  try {
    const friend = await User.findOne({ _id: friendId });
    const user = await User.findOne({ _id: userId });

    if (friend) {
      if (!user.friends.includes(friendId))
        return res.status(400).json({
          success: false,
          error: "This person is not in yout friend list.",
        });
      const filteredFriendList = user.friends.filter(
        (f) => f.toString() !== friendId
      );
      await User.findByIdAndUpdate(userId, { friends: filteredFriendList });
      return res.json({
        success: true,
        message: "Friend delete succesfully.",
      });
    }
  } catch (error) {
    return res.json({
      success: false,
      error: error,
    });
  }
};

exports.user_check_is_friend = async (req, res, next) => {
  const userId = req.user._id;
  const friendId = req.params.friendId;

  if (!mongoose.isValidObjectId(friendId)) {
    return res.status(400).json({
      success: false,
      error: "User not found: Invalid Object ID.",
    });
  }

  try {
    const user = await User.findById(userId, "friends");
    if (user.friends.includes(friendId)) {
      return res.json({
        success: true,
        message: "This user is in your friend list.",
      });
    } else {
      return res.json({
        success: false,
        message: "This user is not in your friend list.",
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error,
    });
  }
};

exports.user_friends_list = async (req, res, next) => {
  const userId = req.params.id;
  const limit = req.query.limit;
  try {
    const user = await User.findById(userId, "name username friends").populate({
      path: "friends",
      select: "name username profile join_date",
      limit: limit !== undefined ? limit : 0,
      populate: {
        path: "profile",
        select: "-profile_picture.data -profile_thumbnail -_id",
      },
    });
    return res.json({
      success: true,
      friends: user.friends,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

exports.user_friends_ids = async (req, res, next) => {
  const userId = req.params.id;
  if(!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ success: false, error: "User not found: Invalid Object ID." });
  }
  try {
    const user = await User.findById(userId, "friends");
    return res.json({
      success: true,
      friends: user.friends,
    });
  } catch(error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

exports.user_message_history = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const userMessageHistory = await MessageHistory.findOne({
      user: userId,
    }).populate("chats groups");
    if (!userMessageHistory) {
      return res.status(404).json({
        success: false,
        message: "No message history found for this user.",
      });
    }
    res.json({
      success: true,
      userMessageHistory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Search

exports.search_user = async (req, res, next) => {
  const query = req.params.query;
  const result = validationResult(req);
  const errors = result.array();

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: errors,
    });
  }

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .select("username name profile")
      .populate({
        path: "profile",
        select: "-profile_picture.data -profile_thumbnail",
      });

    if (users.length > 0) {
      res.json({ success: true, users: users });
    } else {
      res.json({ success: false, message: "No users found." });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
