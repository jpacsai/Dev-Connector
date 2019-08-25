const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const postMiddleware = require('../../middleware/post');

const Post = require('../../models/Post');
const User = require('../../models/User');
const Comment = require('../../models/Comment');

// @route    POST api/posts
// @descr    Create post
// @access   Public
router.post('/', [
  auth,
  [ check('text', 'Text is required').not().isEmpty() ]
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.user.id).select('-password');
  
    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    });

    const post = await newPost.save();

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/posts/all
// @descr    Get all posts
// @access   Private
router.get('/all', auth, async (req, res) => {
  try {
    // TODO: populate post with comment
    const posts = await Post.find().sort({ date: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/posts
// @descr    Get all posts of a user
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    // TODO: populate post with comment
    const posts = await Post.find({ user: req.user.id }).sort({ date: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/posts/:id
// @descr    Get post by ID
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    // TODO: populate post with comment
    const post = await Post.findById(req.params.id);

    if(!post) return res.status(404).json({ msg: 'Post not found'});
    res.json(post);
  } catch (err) {
    console.error(err.message);

    if(err.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found'});

    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/posts/:id
// @descr    Delete post
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if(!post) return res.status(404).json({ msg: 'Post not found'});

    // Check user
    if (post.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized'});
    
    await post.remove();
    
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);

    if(err.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found'});

    res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/:id/like
// @descr    Like a post
// @access   Private
router.put('/:id/like', auth, async (req, res) => {
  try {
    Post.findById(req.params.id, async (err, post) => {
      if (err) return res.status(500).send('Server Error');

      if (!post) return res.status(404).json({ msg: 'Post not found'});

      // Unlike if the post has already been liked
      if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
        const updated = await Post.findByIdAndUpdate(
          req.params.id,
          { $pull: { likes : { user: req.user.id } } },
          { new: true }
        );

        console.log('Post unliked');

        return res.json(updated);
      }

      // Like if the post has not been liked
      const updated = await Post.findByIdAndUpdate(
        req.params.id,
        { $push: { likes: { $each: [ { user: req.user.id } ] }, $position: 0 }},
        { new: true }
      );

      console.log('Post liked');

      res.json(updated);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/:id/comment
// @descr    Comment on a post
// @access   Private
router.post('/:id/comment', [
  auth,
  [ check('text', 'Text is required').not().isEmpty() ],
  postMiddleware
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.user.id).select('-password');

    if(!user) return res.status(404).json({ msg: 'User not found'});

    const commentFileds = {
      post: req.postID,
      text: req.body.text,
      name: user.name,
      avatar: user.avatar
    };

    const newExperience = new Comment(commentFileds);

    console.log('creating comment');

    const { id: newCommentID } = await newExperience.save();

    // Update experience reference list in Profile
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: newCommentID } },
      { new: true }
    );

    if(!post) return res.status(404).json({ msg: 'Post not found'});
    
    res.json(newExperience);
  } catch (err) {
    console.error(err.message);

    if(err.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found'});

    res.status(500).send('Server Error');
  }
});

module.exports = router;