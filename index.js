const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());






app.get('/', (req, res) => {
    res.send('server running')
  })
  
  app.listen(port, () => {
    console.log(`server running on port: ${port}`);
  })