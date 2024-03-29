const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'profile'
  },
  school: {
    type: String,
    required: true
  },
  certificate: {
    type: String,
    required: true
  },
  field_of_study: {
    type: String
  },
  from: {
    type: Date,
    required: true
  },
  to: {
    type: Date
  },
  current: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  }
});

module.exports = Education = mongoose.model('education', EducationSchema);
