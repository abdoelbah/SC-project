const Post = require( "../models/postModel.js");
const User = require("../models/userModel.js" );
const cloudinary = require('cloudinary').v2;


class PostController {
    async createPost(req, res) {
        try {
            const { postedBy, text } = req.body;
            let { img } = req.body;

            if (!postedBy || !text) {
                return res.status(400).json({ error: "Postedby and text fields are required" });
            }

            const user = await User.findById(postedBy);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            if (user._id.toString() !== req.user._id.toString()) {
                return res.status(401).json({ error: "Unauthorized to create post" });
            }

            const maxLength = 500;
            if (text.length > maxLength) {
                return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
            }

            if (img) {
                const uploadedResponse = await cloudinary.uploader.upload(img);
                img = uploadedResponse.secure_url;
            }

            const newPost = new Post({ postedBy, text, img });
            await newPost.save();

            res.status(201).json(newPost);
        } catch (err) {
            res.status(500).json({ error: err.message });
            console.log(err);
        }
    }

    async getPost(req, res) {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }

            res.status(200).json(post);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deletePost(req, res) {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }

            if (post.postedBy.toString() !== req.user._id.toString()) {
                return res.status(401).json({ error: "Unauthorized to delete post" });
            }

            if (post.img) {
                const imgId = post.img.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(imgId);
            }

            await Post.findByIdAndDelete(req.params.id);

            res.status(200).json({ message: "Post deleted successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async likeUnlikePost(req, res) {
        try {
            const { id: postId } = req.params;
            const userId = req.user._id;

            const post = await Post.findById(postId);

            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }

            const userLikedPost = post.likes.includes(userId);

            if (userLikedPost) {
                // Unlike post
                await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
                res.status(200).json({ message: "Post unliked successfully" });
            } else {
                // Like post
                post.likes.push(userId);
                await post.save();
                res.status(200).json({ message: "Post liked successfully" });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async replyToPost(req, res) {
        try {
            const { text } = req.body;
            const postId = req.params.id;
            const userId = req.user._id;
            const userProfilePic = req.user.profilePic;
            const username = req.user.username;

            if (!text) {
                return res.status(400).json({ error: "Text field is required" });
            }

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }

            const reply = { userId, text, userProfilePic, username };

            post.replies.push(reply);
            await post.save();

            res.status(200).json(reply);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getUserPosts(req, res) {
        const { username } = req.params;
        try {
            console.log(`Fetching user with username: ${username}`);
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            console.log(`Fetching posts for user ID: ${user._id}`);
            const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

            console.log(`Found ${posts.length} posts for user ID: ${user._id}`);
            res.status(200).json(posts);
        } catch (error) {
            console.error(`Error fetching user posts: ${error.message}`);
            res.status(500).json({ error: error.message });
        }
    }

}

module.exports = new PostController();
