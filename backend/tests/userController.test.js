const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/userModel.js');
const UserController = require('../controllers/userController.js');
const bcrypt = require('bcryptjs');
const generateTokenAndSetCookie = require('../utils/helpers/generateTokenAndSetCookie.js');

const app = express();
app.use(express.json());

jest.mock('../models/userModel.js');
jest.mock('bcryptjs');
jest.mock('../utils/helpers/generateTokenAndSetCookie.js');

// Mock authentication middleware
const mockAuth = (req, res, next) => {
    req.user = { _id: 'userId123', profilePic: 'profilePicUrl', username: 'testuser' };
    next();
};

app.get('/user/profile/:query', mockAuth, (req, res) => UserController.getUserProfile(req, res));
app.post('/user/signup', (req, res) => UserController.signupUser(req, res));
app.post('/user/login', (req, res) => UserController.loginUser(req, res));
app.post('/user/logout', mockAuth, (req, res) => UserController.logoutUser(req, res));
app.post('/user/follow/:id', mockAuth, (req, res) => UserController.followUnFollowUser(req, res));

// Sample tests
describe('UserController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe('signupUser', () => {
        it('should sign up a new user', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedPassword');
            User.mockImplementation((user) => ({
                ...user,
                save: jest.fn().mockResolvedValue(user),
            }));
            generateTokenAndSetCookie.mockImplementation(() => {});

            const response = await request(app)
                .post('/user/signup')
                .send({ name: 'Test User', email: 'test@example.com', username: 'testuser', password: 'password123' });

            expect(response.status).toBe(201);
            expect(response.body.username).toBe('testuser');
        });

        it('should return error if user already exists', async () => {
            User.findOne.mockResolvedValue({ _id: 'userId123' });

            const response = await request(app)
                .post('/user/signup')
                .send({ name: 'Test User', email: 'test@example.com', username: 'testuser', password: 'password123' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('User already exists');
        });
    });

    describe('loginUser', () => {
        it('should log in a user', async () => {
            const user = { _id: 'userId123', username: 'testuser', password: 'hashedPassword' };
            User.findOne.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(true);
            generateTokenAndSetCookie.mockImplementation(() => {});

            const response = await request(app)
                .post('/user/login')
                .send({ username: 'testuser', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.username).toBe('testuser');
        });

        it('should return error if invalid username or password', async () => {
            User.findOne.mockResolvedValue(null);

            const response = await request(app)
                .post('/user/login')
                .send({ username: 'testuser', password: 'password123' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid username or password');
        });
    });

    describe('logoutUser', () => {
        it('should log out a user', async () => {
            const response = await request(app)
                .post('/user/logout');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User logged out successfully');
        });
    });

    describe('followUnFollowUser', () => {
        it('should follow a user', async () => {
            const userToModify = { _id: 'userId456', followers: [] };
            const currentUser = { _id: 'userId123', following: [] };
            User.findById.mockResolvedValueOnce(userToModify);
            User.findById.mockResolvedValueOnce(currentUser);
            User.findByIdAndUpdate.mockResolvedValueOnce({});
            User.findByIdAndUpdate.mockResolvedValueOnce({});

            const response = await request(app)
                .post('/user/follow/userId456');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User followed successfully');
        });

        it('should unfollow a user', async () => {
            const userToModify = { _id: 'userId456', followers: ['userId123'] };
            const currentUser = { _id: 'userId123', following: ['userId456'] };
            User.findById.mockResolvedValueOnce(userToModify);
            User.findById.mockResolvedValueOnce(currentUser);
            User.findByIdAndUpdate.mockResolvedValueOnce({});
            User.findByIdAndUpdate.mockResolvedValueOnce({});

            const response = await request(app)
                .post('/user/follow/userId456');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User unfollowed successfully');
        });

        it('should return error if trying to follow/unfollow self', async () => {
            const response = await request(app)
                .post('/user/follow/userId123');

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('You cannot follow/unfollow yourself');
        });

        it('should return error if user not found', async () => {
            User.findById.mockResolvedValueOnce(null);

            const response = await request(app)
                .post('/user/follow/userId456');

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('User not found');
        });
    });
});
