
//const dns = require("node:dns");
//dns.setServers(["8.8.8.8", "8.8.4.4"]);


const express=require('express');
const dotenv=require('dotenv');
const cors=require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config()
const uri = process.env.MONGODB_URI
const app=express()
const PORT=process.env.PORT

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    await client.connect();
    
    const db=client.db("adoptpet")
   
    const petCollection=db.collection("pets")

    app.get('/pet', async(req,res)=>{
        const result=await petCollection.find().toArray()
        res.send(result)
    })
   
    app.get("/pet/:id",async(req,res)=>{
      const {id}=req.params

      const result=await petCollection.findOne({_id:new ObjectId(id)})

      res.json(result)
    })
    app.post('/pet', async (req, res) => {
  const petData = req.body;
  console.log("Received data:", petData);
  
  const result = await petCollection.insertOne(petData);
  res.status(201).json(result);
});


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("Server is running fine!")
})

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
})