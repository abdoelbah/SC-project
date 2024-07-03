import express from "express";
import PostController from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/feed", protectRoute, PostController.getFeedPosts);
router.get("/:id", PostController.getPost);
router.get("/user/:username", PostController.getUserPosts);
router.post("/create", protectRoute, PostController.createPost);
router.delete("/:id", protectRoute, PostController.deletePost);
router.put("/like/:id", protectRoute, PostController.likeUnlikePost);
router.put("/reply/:id", protectRoute, PostController.replyToPost);

export default router;
