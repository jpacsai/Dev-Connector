const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');

// @route    POST api/users
// @descr    Register user
// @access   Public
router.post(
  '/',
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
      let isUserInDB = await User.findOne({ email });

      if (!!isUserInDB) return res.status(400).json({ errors: [{ msg: 'User already exists' }] });

      const avatar = gravatar.url(email, { s: '200', r: 'pg', d: 'mm' });

      const salt = await bcrypt.genSalt(10);
      const encryptedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        email,
        name,
        password: encryptedPassword,
        avatar
      });

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });

    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
