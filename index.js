require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', () => {
  console.log('MongoDB Connection Successful');
});

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Users = mongoose.model('Users', new mongoose.Schema({
  username: String
}));

const Log = mongoose.model('Log', new mongoose.Schema({
  userid: String,
  username: String,
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now }
}));

const Exercises = mongoose.model('Exercises', new mongoose.Schema({
  id: String,
  username: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
}));

app.post('/api/users', async (req, res) => {
  try {
    const username = req.body.username;

    const user = new Users({
      username: username
    });

    user.save();

    res.status(200).json({
      username: user.username,
      _id: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    let users = await Users.find({});

    console.log(users);

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params;
    const description = req.body.description;
    const duration = Number(req.body.duration);
    const date = req.body.date
      ? new Date(req.body.date)
      : new Date();

    const user = await Users.findById(userId);

    if (user === null) {
      res.end("User Not Found");
    }

    const log = new Exercises({
      id: userId,
      username: user.username,
      description: description,
      duration: duration,
      date: date
    });

    console.log(log)

    let logDate = log.date.toDateString();
    console.log(log)

    await log.save();

    res.status(200).json({
      id: userId,
      username: log.username,
      description: log.description,
      duration: log.duration,
      date: logDate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await Users.findById(req.params);
    const limit = Number(req.query.limit) || 0;
    
    const to = req.query.to || new Date(Date.now());
    const from = req.query.from || new Date(0);

    const log = await Log.find({
      userid: req.params.id,
      date: { $gte: from , $lte: to }
    })
    .select("-_id -userid -__v")
    .limit(limit);
    
    let userLog = log.map((each) => {
      return {
        description: each.description,
        duration: each.duration,
        date: new Date(each.date).toDateString(),
      };
    });

    res.json({
      _id: req.params,
      username: user.username,
      count: log.length,
      log: userLog,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
