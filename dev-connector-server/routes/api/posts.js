const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const Post = require('../../models/Post')
const User = require('../../models/User')

router
    //@route        POST api/posts
    //@description  Create a post
    //@access       Private
    .post('/',
        [
            auth,
            check('text', 'Text is required').not().isEmpty()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const user = await User.findById(req.user.id).select('-password');
                //creating a post object
                const newPost = new Post({
                    text: req.body.text,
                    name: user.name,
                    avatar: user.avatar,
                    user: req.user.id
                })
                const post = await newPost.save();
                res.json(post);
            } catch (err) {
                console.log(err.message);
                res.status(500).send("Server Error");
            }
        })
    //@route        GET api/posts/:id
    //@description  Get post by id
    //@access       Private
    .get('/:id', auth, async (req, res) => {
        try {
            const posts = await Post.findById(req.params.id);
            if (!posts)
                return res.status(404).send("No Post Available");
            res.json(posts);
        } catch (err) {
            if (err.kind === 'ObjectId')
                return res.status(400).json({ mssg: 'No Post Available' });
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        GET api/posts
    //@description  Get all post
    //@access       Private
    .get('/', auth, async (req, res) => {
        try {
            const posts = await Post.find().sort({ date: -1 });//-1 for the newest for oldest +1
            res.json(posts);
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        DELETE api/posts/:id
    //@description  Delete post by id
    //@access       Private
    .delete('/:id', auth, async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post)
                return res.status(404).send("No Post Available");
            //check for valid user
            if (post.user.toString() !== req.user.id) {
                return res.status(403).json({ msg: "Not authorized to delete the post." })
            }
            await post.remove();
            return res.send("Post Removed");
        } catch (err) {
            if (err.kind === 'ObjectId')
                return res.status(400).json({ mssg: 'No Post Available' });
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        PUT api/posts/like/:id
    //@description  Like a post 
    //@access       Private
    .put('/like/:id', auth, async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post)
                return res.status(404).send("No Post Available");
            //check if the post already liked
            if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                return res.status(400).json({ msg: "Post already liked" })
            }
            post.likes.unshift({ user: req.user.id })
            await post.save();
            return res.json(post.likes);
        } catch (err) {
            if (err.kind === 'ObjectId')
                return res.status(400).json({ mssg: 'No Post Available' });
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        PUT api/posts/unlike/:id
    //@description  Unlike a post 
    //@access       Private
    .put('/unlike/:id', auth, async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post)
                return res.status(404).send("No Post Available");
            //check if the post already liked
            if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                return res.status(400).json({ msg: "Post has not yet been liked" })
            }
            const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
            if (removeIndex >= 0) {
                post.likes.splice(removeIndex, 1)
            }
            await post.save();
            res.json({ post });
        } catch (err) {
            if (err.kind === 'ObjectId')
                return res.status(400).json({ mssg: 'No Post Available' });
            console.log(err.message);
            res.status(500).send("Server Error");
        }
    })
    //@route        POST api/posts/comment/:id
    //@description  Add a comment
    //@access       Private
    .post('/comment/:id',
        [
            auth,
            check('text', 'Text is required').not().isEmpty()
        ]
        , async (req, res) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }
            try {
                const user = await User.findById(req.user.id).select('-password')
                const post = await Post.findById(req.params.id)
                const newComment = {
                    text: req.body.text,
                    name: user.name,
                    avatar: user.avatar,
                    user: req.user.id
                }
                post.comments.unshift(newComment)
                await post.save()
                res.json(post.comments)
            } catch (er) {
                if (err.kind === 'ObjectId')
                    return res.status(400).json({ mssg: 'No Post Available' });
                console.error(err.message)
                res.status(500).send('server error')
            }
        })
    //@route        POST /comment/:id/comment/:comment_id
    //@description  Delete a comment
    //@access       Private
    .delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
        try {
            const post = await Post.findById(req.params.post_id)
            const comments = await post.comments.find(comment => comment.id === req.params.comment_id);
            //make sure comment exits
            if (!comments)
                return res.status(404).json({ msg: "Comment does not exit" })
            //check user
            if (comments.user.toString() !== req.user.id)
                return res.status(404).json({ msg: "User not authorized" })
            const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
            if (removeIndex >= 0) {
                post.comments.splice(removeIndex, 1)
                await post.save();
            }
            await post.save();
            res.json(post.comments)
        } catch (err) {
            if (err.kind === 'ObjectId')
                return res.status(400).json({ mssg: 'No Post Available' });
            console.error(err.message)
            res.status(500).send('server error')
        }
    })
module.exports = router