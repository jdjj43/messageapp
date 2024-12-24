const mongoose = require('mongoose');

const connectDB = async(uri) => {
  try {
    await mongoose.connect(uri)
    console.log('DB up!')
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectDB;