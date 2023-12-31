const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gxta02q.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);


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
        await client.connect();

        const usersCollection = client.db('fashionecommerce').collection('users');
        const reviewsCollection = client.db('fashionecommerce').collection('reviews');
        const paymentCollection = client.db('fashionecommerce').collection('payment');
        const servicesCollection = client.db('fashionecommerce').collection('services');


        app.get('/services', async (req, res) => {
            const result = await servicesCollection.find().toArray();
            res.send(result);
        })

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'users already exists', insertedId: null })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token });
        })

        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        })

        app.post('/create-payment-intent', async (req, res) => {
            const { amount } = req.body; // Pass the amount from the client-side
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount * 100, // Amount in cents
                    currency: 'usd', // Change currency as per your requirement
                });
                res.json({ clientSecret: paymentIntent.client_secret });
            } catch (error) {
                // Handle Stripe API errors properly
                console.error('Error creating PaymentIntent:', error);
                res.status(500).json({ error: error.message });
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
    res.send('fashion e-commerce server running');
})

app.listen(port, () => {
    console.log(`fashion e-commerce port is: ${port}`);
})
