const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 3000;

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fwntuaw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// Add this before the "run" function

// Define the field names for the admission form data
const admissionFields = ['collegeName', 'candidateName', 'subject', 'candidateEmail', 'candidatePhone', 'address', 'dateOfBirth'];

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await 
    client.connect();

    const CollegeDetails = client.db('campusCareDB').collection('colleges');
    const ResearchPaper = client.db('campusCareDB').collection('papers');
    const admissionCollection = client.db('campusCareDB').collection('admissions');


    app.get('/colleges', async (req, res) => {
      const cursor = CollegeDetails.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/college/:id', async (req, res) => {
      const { id } = req.params;
      try {
        console.log("College ID received:", id);
        const college = await CollegeDetails.findOne({ _id: new ObjectId(id) });
        if (!college) {
          return res.status(404).json({ error: 'College not found' });
        }
        res.json(college);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    app.get('/paper', async (req, res) => {
      const cursor = ResearchPaper.find();
      const result = await cursor.toArray();
      res.send(result);
    })




    app.post('/admission', upload.single('candidateImage'), async (req, res) => {
      try {
        const admissionData = {};
        // Retrieve the admission data from the request body
        admissionFields.forEach((field) => {
          admissionData[field] = req.body[field];
        });
    
        // Add the candidateImage to the admission data as base64
        if (req.file) {
          admissionData.candidateImage = req.file.buffer.toString('base64');
        }
    
        // Check if the email address is already admitted to the college
        const admissionCollection = client.db('campusCareDB').collection('admissions');
        const existingAdmission = await admissionCollection.findOne({
          candidateEmail: admissionData.candidateEmail
        });
        console.log(existingAdmission);
    
        if (existingAdmission) {
          return res.status(400).json({
            error: `You are already admitted to ${admissionData.collegeName}`,
          });
        }
    
        // Save the admission data to the database
        const result = await admissionCollection.insertOne(admissionData);
        res.status(201).json({ message: 'Admission data saved successfully', id: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('server running')
  })
  
  app.listen(port, () => {
    console.log(`server running on port: ${port}`);
  })