const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app=express();
require('dotenv').config();
const port=process.env.PORT||5000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ygtywwo.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req,res,next){
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:'unauthorized access'});

    }
    const token=authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRECT,function(err,decoded){
        if(err){
            return res.status(403).send({message:'forbiden access'});
        }
        req.decoded=decoded;
        next();
    })
}


async function run(){
    try{
        const serviceCollection=client.db('genious-car').collection('services');
        const orderCollection=client.db('genious-car').collection('orders');

        app.post('/jwt',(req,res)=>{
            const user=req.body;
            const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRECT,{expiresIn:'1d'})
            res.send({token})
            
        })

        app.get('/services',async(req,res)=>{
            const query={}
            const cursor=serviceCollection.find(query);
            const services =await cursor.toArray();
            res.send(services)
        });
        app.get('/services/:id',async(req,res)=>{
            const id=req.params.id;
            const query={_id:ObjectId(id)};
            const service=await serviceCollection.findOne(query);
            res.send(service);
        });
        // orders api
        app.get('/orders',verifyJWT,async (req,res)=>{

            const decoded=req.decoded;
            
            if(decoded.email!== req.query.email){
                res.status(403).send({message:'unauthorijed access'})
            }



            // console.log(req.headers.authorization)
            
            let query={};
            if(req.query.email){
                query={
                    email:req.query.email
                }
            }
            const cursor=orderCollection.find(query);
            const orders= await cursor.toArray();
            res.send(orders)
        })
        app.post('/orders',verifyJWT,async(req,res)=>{
            const order=req.body;
            const result=await orderCollection.insertOne(order);
            res.send(result);
        });

        app.patch('/orders/:id',verifyJWT,async(req,res)=>{
            const id=req.params.id;
            const status=req.body.status
            const query={_id:ObjectId(id)}
            const updatedDoc={
                $set:{
                    status:status
                }
            }
            const result=await orderCollection.updateOne(query,updatedDoc);
            res.send(result);
        })


        app.delete('/orders/:id',verifyJWT,async (req,res)=>{
            const id=req.params.id;
            const query={_id:ObjectId(id)};
            const result=await orderCollection.deleteOne(query);
            res.send(result);
        })

    }
    finally{

    }

}
run().catch(err=>console.error(err));


app.get('/',(req,res)=>{
    res.send('this is working')
})
app.listen(port,()=>{
    console.log(`Genious car server running port ${port}`)
})