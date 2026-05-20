//const dns = require("node:dns");
//dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require('dotenv');
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dotenv.config();

const uri = process.env.MONGODB_URI;
const app = express();
const PORT = process.env.PORT || 5000; // Fallback to 5000 if PORT environment variable isn't read

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS=createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
)

const verifyToken=async(req,res,next)=>{
  const authHeader=req?.headers.authorization
  // FIXED: Changed to !authHeader so it blocks requests that MISS the header
  if(!authHeader){
    return res.status(401).json({message:"unauthorized"})
  }
  //console.log(authHeader)
  
  const token=authHeader.split(" ")[1]
  if(!token){
    return res.status(401).json({message:"unauthorized"})
  }
 
  try{
    const {payload}=await jwtVerify(token,JWKS)
  console.log(payload)
  next()
  }catch(err){
    return res.status(403).json({message:"Forbidden"});
  }
 
  //console.log(token)
// next()
}

async function run() {
  try {
    await client.connect();
    
    const db = client.db("adoptpet");
    const petCollection = db.collection("pets");

    // Get all pets
    app.get('/pet', async (req, res) => {
      const result = await petCollection.find().toArray();
      res.send(result);
    });
   
    // Get single pet by ID (Protected)
    app.get("/pet/:id",verifyToken, (req, res, next) => {
      const authorizationHeader = req.headers.authorization;
      console.log(authorizationHeader)
      // Fixed the typo here by matching the variable names correctly
      
        next();
      
    }, async (req, res) => {
      try {
        const { id } = req.params;

        // Ensure the ID structure is a valid 24-character hexadecimal string before passing to ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid pet ID format" });
        }

        const result = await petCollection.findOne({ _id: new ObjectId(id) });

        if (!result) {
          return res.status(404).json({ error: "Pet not found" });
        }

        res.json(result);
      } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Create a new pet listing
    app.post('/pet', async (req, res) => {
      const petData = req.body;
      console.log("Received data:", petData);
      
      const result = await petCollection.insertOne(petData);
      res.status(201).json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect or run backend routes:", error);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("Server is running fine!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});