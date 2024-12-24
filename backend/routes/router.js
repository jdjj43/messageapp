const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const chatController = require('../controllers/chatController');
const passport = require('../config/passport');

// User 
router.post('/user/create', userController.user_create);
router.post('/user/login', userController.user_login);
router.get('/user/session', passport.authenticate('jwt', { session: false }), userController.user_check_session);
router.put('/user/edit', passport.authenticate('jwt', { session: false }), userController.user_edit);
router.get('/user/get/:id', userController.user_get_profile_info);
router.get('/user/full/:id', userController.user_get_full_info);
router.get('/user/message_history', passport.authenticate('jwt', { session: false }), userController.user_message_history);
// router.get('user/heartbeat', passport.authenticate('jwt', { session: false }), userController.user_heartbeat);

// User Profile
router.put('/user/profile/avatar/delete', passport.authenticate('jwt', { session: false }), userController.user_profile_delete_image);
router.get('/user/profile/avatar/:id', userController.user_profile_image);
router.get('/user/profile/thumbnail/:id', userController.user_profile_thumbnail);
router.post('/user/profile/edit', passport.authenticate('jwt', { session: false }), userController.user_edit_profile);

// User Friends
router.put('/user/friends/add/:id', passport.authenticate('jwt', { session: false }), userController.user_friends_add);
router.put('/user/friends/remove/:id', passport.authenticate('jwt', { session: false }), userController.user_friends_remove);
router.get('/user/friends/:friendId/isfriend', passport.authenticate('jwt', { session: false }), userController.user_check_is_friend);
router.get('/user/:id/friends/', passport.authenticate('jwt', { session: false }), userController.user_friends_list);
router.get('/user/:id/friends_ids/', passport.authenticate('jwt', { session: false }), userController.user_friends_ids);

// Chat
router.get('/chats/all/', passport.authenticate('jwt', { session: false }), chatController.chats_get_from_user);
router.get('/chat/get/:id', passport.authenticate('jwt', { session: false }), chatController.chat_get_single);
router.get('/chat/user/:id', passport.authenticate('jwt', { session: false }), chatController.chat_get_single_by_user);
router.post('/chat/create/:id', passport.authenticate('jwt', { session: false }), chatController.chat_create_direct);
router.post('/chat/message/send/:id', passport.authenticate('jwt', { session: false }), chatController.chat_send_message);
router.delete('/chat/message/delete_for_all/:id', passport.authenticate('jwt', { session: false }), chatController.chat_delete_message_for_all);
router.delete('/chat/:chatId/message/delete_for_user/:messageId', passport.authenticate('jwt', { session: false }), chatController.chat_delete_message_for_user);
router.delete('/chat/:chatId/message/delete_all', passport.authenticate('jwt', { session: false }), chatController.chat_messages_empty);
router.delete('/chat/delete_for_all/:userId', passport.authenticate('jwt', { session: false }), chatController.chat_delete_for_all);
router.delete('/chat/delete_for_user/:userId', passport.authenticate('jwt', { session: false }), chatController.chat_delete_for_user);
router.delete('/stray_messages/:password', chatController.clear_stray_messages);

// group

router.get('/group/all/', passport.authenticate('jwt', { session: false }), chatController.group_get_all_from_user);
router.get('/group/:groupid/get', passport.authenticate('jwt', { session: false }), chatController.group_get_single);
router.post('/group/create/', passport.authenticate('jwt', { session: false }), chatController.group_create);
router.post('/group/:groupId/message/add/', passport.authenticate('jwt', { session: false }), chatController.group_send_message);
router.put('/group/:groupId/edit/', passport.authenticate('jwt', { session: false }), chatController.group_change_info);
router.put('/group/:id/users/add', passport.authenticate('jwt', { session: false }), chatController.group_users_add);
router.put('/group/:id/member/add', passport.authenticate('jwt', { session: false }), chatController.group_user_add);
router.put('/group/:id/member/remove', passport.authenticate('jwt', { session: false }), chatController.group_user_remove);
router.put('/group/:id/users/remove', passport.authenticate('jwt', { session: false }), chatController.group_users_remove);
router.put('/group/:groupId/leave', passport.authenticate('jwt', { session: false }), chatController.group_user_exit);
router.put('/group/:id/admin/add/:userId', passport.authenticate('jwt', { session: false }), chatController.groud_admins_add);
router.put('/group/:id/admin/remove/:userId', passport.authenticate('jwt', { session: false }), chatController.groud_admins_remove);

// Images

router.get('/chat/message/image/:id', chatController.message_get_image);
router.get('/group/:id/thumbnail', chatController.group_get_thumbnail);

// Search

router.get('/users/search/:query', userController.search_user);

module.exports = router;