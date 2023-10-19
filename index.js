const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware

app.use(express.json());
app.use(cors());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ikmixap.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const brandCollection = client.db("brandDB").collection("brands");


    // post brand name and image into database

    app.post('/brands', async (req, res) => {
      const brands = req.body;
      const result = await brandCollection.insertMany(brands);
      res.send(result);
    })

    // read brand name and image from database

    app.get('/brands', async (req, res) => {
      const result = await brandCollection.find().toArray();
      res.send(result)
    })


    // posting data to database from add product page


    app.post('/brands/add-product', async (req, res) => {
      const { brandName, newProduct } = req.body;

      try {
        const query = { name: { $regex: new RegExp(brandName, 'i') } };
        const brand = await brandCollection.findOne(query);

        if (brand) {
          brand.product.push(newProduct);
          const result = await brandCollection.updateOne(query, { $set: { product: brand.product } });
          res.send(result);
        } else {
          const newBrand = {
            name: brandName,
            product: [newProduct]
          };
          const newBrandResult = await brandCollection.insertOne(newBrand);
          res.send(newBrandResult);
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // showing details data by id from database

    app.get('/brands/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await brandCollection.findOne(query);
      res.send(result)
    })






    // Send a ping to confirm a successful connection
    client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Brand shop server is running...')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})