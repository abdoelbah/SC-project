const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/postModel.js');
const User = require('../models/userModel.js');
const PostController = require('../controllers/postController.js');
const { v2: cloudinary } = require('cloudinary');

const app = express();
app.use(express.json());

jest.mock('../models/postModel.js');
jest.mock('../models/userModel.js');
jest.mock('cloudinary');

// Mock authentication middleware
const mockAuth = (req, res, next) => {
    req.user = { _id: 'userId123', profilePic: 'profilePicUrl', username: 'testuser' };
    next();
};

app.post('/posts', mockAuth, (req, res) => PostController.createPost(req, res));
app.get('/posts/:id', mockAuth, (req, res) => PostController.getPost(req, res));
app.delete('/posts/:id', mockAuth, (req, res) => PostController.deletePost(req, res));
app.post('/posts/:id/like', mockAuth, (req, res) => PostController.likeUnlikePost(req, res));
app.post('/posts/:id/reply', mockAuth, (req, res) => PostController.replyToPost(req, res));
app.get('/feed', mockAuth, (req, res) => PostController.getFeedPosts(req, res));
app.get('/user/:username/posts', mockAuth, (req, res) => PostController.getUserPosts(req, res));

// Sample tests
describe('PostController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createPost', () => {
        it('should create a new post', async () => {
            User.findById.mockResolvedValue({ _id: 'userId123' });
            Post.mockImplementation((post) => ({
                ...post,
                save: jest.fn().mockResolvedValue(post),
            }));
            cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'imageUrl' });

            const response = await request(app)
                .post('/posts')
                .send({ postedBy: 'userId123', text: 'Hello World', img: 'imageData' });

            expect(response.status).toBe(201);
            expect(response.body.text).toBe('Hello World');
            expect(response.body.img).toBe('imageUrl');
        });

        it('should return error if required fields are missing', async () => {
            const response = await request(app)
                .post('/posts')
                .send({ postedBy: 'userId123' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Postedby and text fields are required');
        });

        it('should return error if text exceeds maxLength', async () => {
            const longText = 'a'.repeat(501);
            const response = await request(app)
                .post('/posts')
                .send({ postedBy: 'userId123', text: longText });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Text must be less than 500 characters');
        });
    });

    describe('getPost', () => {
        it('should return a post', async () => {
            Post.findById.mockResolvedValue({ _id: 'postId123', text: 'Hello World' });

            const response = await request(app)
                .get('/posts/postId123');

            expect(response.status).toBe(200);
            expect(response.body.text).toBe('Hello World');
        });

        it('should return error if post not found', async () => {
            Post.findById.mockResolvedValue(null);

            const response = await request(app)
                .get('/posts/postId123');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Post not found');
        });
    });

    describe('deletePost', () => {
        it('should delete a post', async () => {
            Post.findById.mockResolvedValue({ _id: 'postId123', postedBy: 'userId123', img: 'http://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' });
            cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

            const response = await request(app)
                .delete('/posts/postId123');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Post deleted successfully');
        });

        it('should return error if post not found', async () => {
            Post.findById.mockResolvedValue(null);

            const response = await request(app)
                .delete('/posts/postId123');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Post not found');
        });
    });

    describe('likeUnlikePost', () => {
        it('should like a post', async () => {
            Post.findById.mockResolvedValue({
                _id: 'postId123',
                likes: [],
                save: jest.fn().mockResolvedValue(true),
            });

            const response = await request(app)
                .post('/posts/postId123/like');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Post liked successfully');
        });

        it('should unlike a post', async () => {
            Post.findById.mockResolvedValue({
                _id: 'postId123',
                likes: ['userId123'],
                save: jest.fn().mockResolvedValue(true),
            });

            Post.updateOne.mockResolvedValue({});

            const response = await request(app)
                .post('/posts/postId123/like');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Post unliked successfully');
        });

        it('should return error if post not found', async () => {
            Post.findById.mockResolvedValue(null);

            const response = await request(app)
                .post('/posts/postId123/like');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Post not found');
        });
    });

    describe('replyToPost', () => {
        it('should reply to a post', async () => {
            Post.findById.mockResolvedValue({
                _id: 'postId123',
                replies: [],
                save: jest.fn().mockResolvedValue(true),
            });

            const response = await request(app)
                .post('/posts/postId123/reply')
                .send({ text: 'This is a reply' });

            expect(response.status).toBe(200);
            expect(response.body.text).toBe('This is a reply');
        });

        it('should return error if text field is missing', async () => {
            const response = await request(app)
                .post('/posts/postId123/reply')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Text field is required');
        });

        it('should return error if post not found', async () => {
            Post.findById.mockResolvedValue(null);

            const response = await request(app)
                .post('/posts/postId123/reply')
                .send({ text: 'This is a reply' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Post not found');
        });
    });

    describe('getFeedPosts', () => {
        it('should return feed posts', async () => {
            User.findById.mockResolvedValue({ _id: 'userId123', following: ['userId456'] });
            Post.find.mockResolvedValue([{ _id: 'postId123', text: 'Hello World' }]);

            const response = await request(app)
                .get('/feed');

            expect(response.status).toBe(200);
            expect(response.body[0].text).toBe('Hello World');
        });

        it('should return error if user not found', async () => {
            User.findById.mockResolvedValue(null);

            const response = await request(app)
                .get('/feed');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

    describe('getUserPosts', () => {
        it('should return user posts', async () => {
            User.findOne.mockResolvedValue({ _id: 'userId123' });
            Post.find.mockResolvedValue([{ _id: 'postId123', text: 'Hello World' }]);

            const response = await request(app)
                .get('/user/testuser/posts');

            expect(response.status).toBe(200);
            expect(response.body[0].text).toBe('Hello World');
        });

        it('should return error if user not found', async () => {
            User.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get('/user/testuser/posts');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });
});
