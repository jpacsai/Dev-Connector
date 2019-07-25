const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  if (!token) return res.status(401).json({ msg: 'No token, authorization denied'});
  
  try {
    const { user: decodedUser } = jwt.verify(token, config.get('jwtSecret'));
    req.user = decodedUser;
    next();
  } catch(err) {
    console.log(err.message);
    res.status(401).json({ msg: 'Token is not valid '});
  }
}