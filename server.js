const express = require('express');
const connectDB = require('./config/db');

// Import routes
const auth = require('./server/routes/api/auth');
const posts = require('./server/routes/api/posts');
const profile = require('./server/routes/api/profile');
const users = require('./server/routes/api/users');

const app = express();

// Connect db
connectDB();

// Init middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API running...'));

// Define routes
app.use('/api/auth', auth);
app.use('/api/posts', posts);
app.use('/api/profile', profile);
app.use('/api/users', users);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}...`));
