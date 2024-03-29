const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  company: {
    type: String
  },
  website: {
    type: String
  },
  location: {
    type: String
  },
  status: {
    type: String,
    required: true
  },
  skills: {
    type: [ String ],
    required: true
  },
  bio: {
    type: String
  },
  github_user_name: {
    type: String
  },
  experience: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'experience'
    }
  ],
  education: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'education'
    }
  ],
  social: {
    youtube: {
      type: String
    },
    twitter: {
      type: String
    },
    facebook: {
      type: String
    },
    linkedin: {
      type: String
    },
    instagram: {
      type: String
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
