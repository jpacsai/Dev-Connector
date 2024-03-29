const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const profileMiddleware = require('../../middleware/profile');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const Experience = require('../../models/Experience');
const Education = require('../../models/Education');

// @route    GET api/profile/me
// @descr    Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile
      .findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar'])
      .populate('experience')
      .populate('education');

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
  if (youtube) profileFields.youtube = youtube;
  if (facebook) profileFields.facebook = facebook;
  if (twitter) profileFields.twitter = twitter;
  if (instagram) profileFields.instagram = instagram;
  if (linkedin) profileFields.linkedin = linkedin;

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

// @route    GET api/profile
// @descr    Get all profiles
// @access   Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate('user', ['name', 'avatar'])
      .populate('experience')
      .populate('education');

    res.json(profiles);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    GET api/profile/user/:user_id
// @descr    Get profile by user ID
// @access   Public
router.get('/user/:user_id', auth, async (req, res) => {
  try {
    const profile = await Profile
      .findOne({ user: req.params.user_id })
      .populate('experience')
      .populate('education');

    if (!profile) return res.status(400).json({ msg: 'Profile not found'});
    res.json(profile);
    
  } catch (err) {
    console.error(err.message);
    if(err.kind === 'ObjecId') {
      return res.status(400).json({ msg: 'Profile not found'});
    }
    res.status(500).send('Server error');
  }
});

// @route    POST api/profile/experience
// @descr    Add exprience
// @access   Private
router.post('/experience', [ auth, profileMiddleware, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body;

  const experienceFields = {
    profile: req.profileID,
    title,
    company,
    location,
    from,
    to,
    current,
    description
  }

  try {
    const newExperience = new Experience(experienceFields);

    console.log('creating experience');

    const { id: newExpID } = await newExperience.save();

    // Update experience reference list in Profile
    await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $push: { experience: newExpID } },
      { new: true }
    );

    res.json(newExperience);
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/experience
// @descr    Get all user experience
// @access   Private
router.get('/experience', auth, profileMiddleware, async (req, res) => {
  try {
    const experiences = await Experience.find({ profile: req.profileID });
    res.json(experiences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/profile/experience/:exp_id
// @descr    Update experience
// @access   Private
router.put('/experience/:exp_id', auth, async (req, res) => {
  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body;

  const updateExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  }

  try {
    const experience = await Experience.findOneAndUpdate(
      { _id: req.params.exp_id },
      { $set: updateExp },
      { new: true }
    );

    if (!experience) return res.status(400).json({ msg: 'Experience not found'});

    console.log('updating experience');

    res.json(experience);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile/experience/:exp_id
// @descr    Delete experience from profile
// @access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const deletedExp = await Experience.findByIdAndDelete(req.params.exp_id);

    console.log('deleting experience');

    if (!deletedExp) return res.status(400).json({ msg: 'Experience not found'});
    
    // Removing experience reference from profile
    const profile = await Profile.findOne({ user: req.user.id });
    profile.experience.remove(req.params.exp_id);
    profile.save();
    
    res.json(deletedExp);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile/education
// @descr    Add profile education
// @access   Private
router.post('/education', [ auth, profileMiddleware, [
  check('school', 'School is required').not().isEmpty(),
  check('certificate', 'Certificate is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty(),
  check('field_of_study', 'Field of study date is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    school,
    certificate,
    from,
    field_of_study,
    description
  } = req.body;

  const educationFields = {
    profile: req.profileID,
    school,
    certificate,
    from,
    field_of_study,
    description
  }

  try {
    const newEducation = new Education(educationFields);
    console.log('creating education');
    const { id: newEduID } = await newEducation.save();

    console.log

    // Update education reference list in Profile
    await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $push: { education: newEduID } },
      { new: true }
    );

    res.json(newEducation);

  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/education
// @descr    Get all user education
// @access   Private
router.get('/education', auth, profileMiddleware, async (req, res) => {
  try {
    const educations = await Education.find({ profile: req.profileID });
    res.json(educations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/profile/education/:edu_id
// @descr    Update education
// @access   Private
router.put('/education/:edu_id', auth, async (req, res) => {
  const {
    school,
    certificate,
    from,
    field_of_study,
    description
  } = req.body;

  const updatedEdu = {
    school,
    certificate,
    from,
    field_of_study,
    description
  }

  try {
    const education = await Education.findOneAndUpdate(
      { _id: req.params.edu_id },
      { $set: updatedEdu },
      { new: true }
    );

    if (!education) return res.status(400).json({ msg: 'Education not found'});

    console.log('updating education');
    res.json(education);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile/education/:edu_id
// @descr    Delete education from profile
// @access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const deletedEdu = await Education.findByIdAndDelete(req.params.edu_id);

    console.log('deleting education');

    if (!deletedEdu) return res.status(400).json({ msg: 'Education not found'});

    // Removing experience reference from profile
    const profile = await Profile.findOne({ user: req.user.id });
    profile.education.remove(req.params.edu_id);
    profile.save();

    res.json(deletedEdu);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/github/:username
// @descr    Get user repos from GitHub
// @access   Public
router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&clien_id${config.get('gitHubClientID')}&client_secret=${config.get('gitHubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) return res.status(404).json({ msg: 'No GitHub profile found'});

      res.json(JSON.parse(body));
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
