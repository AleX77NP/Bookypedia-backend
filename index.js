const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI || process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology:true }
).catch(err => console.log(err));
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB connection...');
})

const usersRouter = require('./routes/users')

app.use('/users', usersRouter);

app.get("/", (req, res) => {
  res.json({ message: "API Working" });
});

app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});