const Post = require('../models/Post');

module.exports = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(400).json({ msg: 'Post not found'});

    req.postID = post.id;
    next();
  } catch(err) {
    console.log(err.message);
    res.status(500).send('Server error');
  }
}