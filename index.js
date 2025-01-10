require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses JSON requests
app.use(express.urlencoded({ extended: false })); // Parses URL-encoded requests
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (err) => console.error('Connection error:', err));
db.once('open', () => console.log('MongoDB Connection Successful'));

// Models
const userSchema = new mongoose.Schema({ username: String });
const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  userid: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const newUser = await User.create({ username });
    res.status(201).json({ username: newUser.username, _id: newUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!description || !duration) return res.status(400).json({ error: 'Description and duration are required' });

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newExercise = await Exercise.create({
      userid: _id,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : undefined,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const filter = { userid: _id };

    if (from) {
      filter.date = { $gte: new Date(from) };
    }

    if (to) {
      filter.date = { ...(filter.date || {}), $lte: new Date(to) };
    }


    const logs = await Exercise.find(filter)
      .limit(Number(limit) || 0)
      .select('description duration date');

    res.status(200).json({
      username: user.username,
      count: logs.length,
      log: logs.map((log) => ({
        description: log.description,
        duration: log.duration,
        date: log.date.toDateString(),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
