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
    const reviewCollection = client.db('campusCareDB').collection('reviews');


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
          return res.status(404).json({ error: 'college not found' });
        }
        res.json(college);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server errors' });
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
        admissionFields.forEach((field) => {
          admissionData[field] = req.body[field];
        });
    
        // Add the candidateImage to the admission data as base64
        if (req.file) {
          admissionData.candidateImage = req.file.buffer.toString('base64');
        }
    
        // Check if the email address is already admitted to the college
       
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
    



// Route to get college details for the user based on their email
app.get('/mycollege', async (req, res) => {
  try {
    const userEmail = req.query.email; // Assuming you pass the user's email as a query parameter
    console.log(userEmail);
    // Fetch the admission details for the user from the admissions collection
    const userAdmission = await admissionCollection.findOne({ candidateEmail: userEmail });

    if (!userAdmission) {
      return res.status(404).json({ error: 'Admission not found for this user.' });
    }

    // If the user's admission is found, you can send the college details back to the frontend
    const collegeDetails = {
      name: userAdmission.candidateName,
      collegeName:userAdmission.collegeName,
      address: userAdmission.address,
      phone: userAdmission.candidatePhone,
      email: userAdmission.candidateEmail
    };

    res.json(collegeDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Import the required modules and setup the app...

// Route to post the review to the backend
app.post('/reviews', async (req, res) => {
  try {
    const { collegeName, reviewRating, reviewText,name,email } = req.body;

  

    const reviewData = {
      name,
      collegeName,
      rating: parseInt(reviewRating),
      text: reviewText,
      email 
    };

    
    await reviewCollection.insertOne(reviewData);

    res.status(200).json({ message: 'Review submitted successfully!' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Route to get the reviews from the backend
app.get('/reviews', async (req, res) => {
  try {
    const reviews = await reviewCollection.find().toArray();
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
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