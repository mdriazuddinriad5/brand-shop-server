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
    const cartCollection = client.db("brandDB").collection("cart");
    const clientReview= client.db("brandDB").collection("reviews");


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



    /* Add data to cart */

    app.post('/carts', async (req, res) => {
      const user = req.body;
      const result = await cartCollection.insertOne(user);
      console.log(result);
      res.send(result);
    })


    app.get('/carts', async (req, res) => {
      try {
        const cartItems = await cartCollection.find({}).toArray();
        res.json(cartItems);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching cart items.' });
      }
    });


    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })



    /* Update product related api */

    app.get('/brands/:brandId/products/:index', async (req, res) => {
      try {
        const { brandId, index } = req.params;
        const query = { _id: new ObjectId(brandId) };
        const brand = await brandCollection.findOne(query);

        if (brand && brand.product[index]) {
          const product = brand.product[index];
          res.json(product);
        } else {
          res.status(404).json({ message: 'Product not found' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.put('/brands/update-product', async (req, res) => {
      try {
        const { brandId, index, updatedProduct } = req.body;
        const query = { _id: new ObjectId(brandId) };
        const update = { 
          $set: 
          { 
            [`product.${index}`]: updatedProduct 
          } 
        };
        const result = await brandCollection.updateOne(query, update);

        if (result.modifiedCount === 1) {
          res.json({ success: true, message: 'Product updated successfully' });
        } else {
          res.status(400).json({ success: false, message: 'Product update failed' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });


    // client review

    app.post('/review', async(req, res)=>{
      const review= req.body;
      const result = await clientReview.insertOne(review);
      res.send(result);
    })

    app.get('/review', async (req, res) => {
      const result = await clientReview.find().toArray();
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