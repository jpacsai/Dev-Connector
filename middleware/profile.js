const Profile = require('../models/Profile');

module.exports = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) return res.status(400).json({ msg: 'Profile not found'});

    req.profileID = profile.id;
    next();
  } catch(err) {
    console.log(err.message);
    res.status(500).send('Server error');
  }
}