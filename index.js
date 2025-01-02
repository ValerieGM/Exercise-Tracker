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

const Exercises = mongoose.model('Exercises', new mongoose.Schema({
  id: String,
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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
