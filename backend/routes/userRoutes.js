import express from "express";
import UserController from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/profile/:query", UserController.getUserProfile);
router.post("/signup", UserController.signupUser);
router.post("/login", UserController.loginUser);
router.post("/logout", UserController.logoutUser);
router.post("/follow/:id", protectRoute, UserController.followUnFollowUser);

export default router;
