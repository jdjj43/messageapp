const express = require('express');
const routes = require('./routes/router');
const connectDB = require('./config/database');
const cors = require('cors');
require('dotenv').config();

const app = express();

connectDB(process.env.URI);

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors({
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Hola q tal');
});

app.listen(3000, () => {
  console.log('Server up on port 3000');
});