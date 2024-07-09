const express = require('express');
const PostController = require('../controllers/postController.js');
const protectRoute = require('../middlewares/protectRoute.js');

const router = express.Router();

router.get("/feed", protectRoute, PostController.getFeedPosts);
router.get("/:id", PostController.getPost);
router.get("/user/:username", PostController.getUserPosts);
router.post("/create", protectRoute, PostController.createPost);
router.delete("/:id", protectRoute, PostController.deletePost);
router.put("/like/:id", protectRoute, PostController.likeUnlikePost);
router.put("/reply/:id", protectRoute, PostController.replyToPost);

module.exports = router;
