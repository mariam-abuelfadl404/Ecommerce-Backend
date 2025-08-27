const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/Db.config');
const PORT = process.env.PORT;
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
connectDB();
app.listen(PORT, ()=>{console.log(`Server is running on port ${PORT}`)})

