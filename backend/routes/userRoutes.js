const express = require('express');
const UserController = require('../controllers/userController.js');
const protectRoute = require('../middlewares/protectRoute.js');


const router = express.Router();

router.get("/profile/:query", UserController.getUserProfile);
router.post("/signup", UserController.signupUser);
router.post("/login", UserController.loginUser);
router.post("/logout", UserController.logoutUser);
router.post("/follow/:id", protectRoute, UserController.followUnFollowUser);
module.exports = router;
