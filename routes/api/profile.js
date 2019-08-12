const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route    GET api/profile/me
// @descr    Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'There is no profile for this user' });

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server error');
  }
});

// @route    POST api/profile
// @descr    Create or update a user profile
// @access   Private

router.post('/', [ auth, [
  check('status', 'Status is required').not().isEmpty(),
  check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    company,
    website,
    location,
    bio,
    status,
    github_user_name,
    skills,
    youtube,
    facebook,
    twitter, 
    instagram,
    linkedin
  } = req.body;

  // Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (github_user_name) profileFields.github_user_name = github_user_name;
  if (skills) {
    profileFields.skills = skills.split(',').map(skill => skill.trim());
  }

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      // Update
      const updatedProfile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      console.log('updating user profile');
      return res.json(updatedProfile);
    }

    // Create
    const newProfile = new Profile(profileFields);
    console.log('creating user profile');
    await newProfile.save();
    res.json(newProfile);

  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

module.exports = router;
