exports.chat_send_message = [
  body("text").trim().isString().escape().isLength({ min: 1 }),
  upload.single("image"),
  async (req, res, next) => {
    const userId = req.user._id;
    const userTwoId = req.params.id;
    const image = req.file;

    if (!mongoose.isValidObjectId(userTwoId)) {
      return res.status(400).json({
        success: false,
        error: "User not found: Not valid ObjectID",
      });
    }

    try {
      const [
        userOne,
        userTwo,
        userOneMessageHistory,
        userTwoMessageHistory,
        alreadyHaveChat,
      ] = await Promise.all([
        User.findById(userId).exec(),
        User.findById(userTwoId).exec(),
        MessageHistory.findOne({ user: userId }).populate("chats").exec(),
        MessageHistory.findOne({ user: userTwoId }).populate("chats").exec(),
        Chat.findOne({ users: { $all: [userId, userTwoId] } }).exec(),
      ]);

      if (!userOne || !userTwo) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      let newMessage;
      if (image) {
        newMessage = new Message({
          text: req.body.text,
          image: {
            imageType: image.mimetype,
            data: image.buffer,
          },
          user: userOne._id,
        });
      } else {
        newMessage = new Message({
          text: req.body.text,
          user: userOne._id,
        });
      }

      const newChat = new Chat({
        messages: [newMessage],
        users: [userOne._id, userTwo._id],
        last_message: Date.now(),
      });

      if (!alreadyHaveChat) {
        await newChat.save();
        userOneMessageHistory.chats.push(newChat._id);
        userOneMessageHistory.messages.push(newMessage._id);
        userTwoMessageHistory.chats.push(newChat._id);
        await Promise.all([
          newMessage.save(),
          userOneMessageHistory.save(),
          userTwoMessageHistory.save(),
        ]);

        return res.json({
          success: true,
          message: "Chat created and message sent successfully",
        });
      }

      if (alreadyHaveChat) {
        alreadyHaveChat.messages.push(newMessage);
        alreadyHaveChat.last_message = Date.now();

        const userOneHasChat = userOneMessageHistory.chats.some(
          (chat) => chat._id.toString() === alreadyHaveChat._id.toString()
        );
        const userTwoHasChat = userTwoMessageHistory.chats.some(
          (chat) => chat._id.toString() === alreadyHaveChat._id.toString()
        );

        if (userOneHasChat && !userTwoHasChat) {
          const userTwoChatIndex = userTwoMessageHistory.chats.findIndex(
            (chat) => chat.users.some((user) => user.equals(userOne._id))
          );
          if (userTwoChatIndex !== -1) {
            const userTwoChat = await Chat.findById(
              userTwoMessageHistory.chats[userTwoChatIndex]._id
            );
            userTwoChat.messages.push(newMessage);
            userTwoChat.last_message = Date.now();
            await userTwoChat.save();
          } else {
            userTwoMessageHistory.chats.push(newChat);
            await newChat.save();
          }
          await Promise.all([
            userOneMessageHistory.save(),
            userTwoMessageHistory.save(),
          ]);
        }

        if (userTwoHasChat && !userOneHasChat) {
          const userOneChatIndex = userOneMessageHistory.chats.findIndex(
            (chat) => chat.users.some((user) => user.equals(userTwo._id))
          );
          if (userOneChatIndex !== -1) {
            const userOneChat = await Chat.findById(
              userOneMessageHistory.chats[userOneChatIndex]._id
            );
            userOneChat.messages.push(newMessage);
            userOneChat.last_message = Date.now();
            await userOneChat.save();
          } else {
            userOneMessageHistory.chats.push(newChat);
            newChat.save();
          }
          await Promise.all([
            userOneMessageHistory.save(),
            userTwoMessageHistory.save(),
          ]);
        }

        if (!userOneHasChat && !userTwoHasChat) {
          const userOneChatIndex = userOneMessageHistory.chats.findIndex(
            (chat) => chat.users.some((user) => user.equals(userTwo._id))
          );
          const userTwoChatIndex = userTwoMessageHistory.chats.findIndex(
            (chat) => chat.users.some((user) => user.equals(userOne._id))
          );
          if (userOneChatIndex === -1 && userTwoChatIndex === -1) {
            userOneMessageHistory.chats.push(newChat);
            userTwoMessageHistory.chats.push(newChat);
            userOneMessageHistory.messages.push(newMessage);
            newChat.save();
          }
          if (userOneChatIndex !== -1 && userTwoChatIndex !== -1) {
            const userOneChat = await Chat.findById(
              userOneMessageHistory.chats[userOneChatIndex]._id
            );
            const userTwoChat = await Chat.findById(
              userTwoMessageHistory.chats[userTwoChatIndex]._id
            );
            userOneMessageHistory.messages.push(newMessage);
            if(userOneChat._id.toString() === userTwoChat._id.toString()) {
              userOneChat.messages.push(newMessage);
              userOneChat.last_message = Date.now();
              await userOneChat.save();
            } else {
              userOneChat.messages.push(newMessage);
              userOneChat.last_message = Date.now();
              userTwoChat.messages.push(newMessage);
              userTwoChat.last_message = Date.now();
              await userOneChat.save();
              await userTwoChat.save();
            }
          }

          await Promise.all([
            newMessage.save(),
            userOneMessageHistory.save(),
            userTwoMessageHistory.save(),
          ]);
        } else {
          userOneMessageHistory.messages.push(newMessage);
          await userOneMessageHistory.save();
        }

        await Promise.all([alreadyHaveChat.save(), newMessage.save()]);

        return res.json({
          success: true,
          message: "Message sent successfully",
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
];