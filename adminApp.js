const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const path = require('path');
const express = require('express'); 
const app = express(); 

// loads in proto file
const ADMIN_PATH =  path.join(__dirname, 'proto', 'admin.proto');
const packageAdmin = protoLoader.loadSync(ADMIN_PATH);

const adminProto = grpc.loadPackageDefinition(packageAdmin).admin;

// runs client server
const adminClient = new adminProto.Admin (
    'localhost:50054', 
    grpc.credentials.createInsecure() 
);

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 
app.use(express.urlencoded({ extended: true }));

// renders the page
app.get('/', (req, res) => { 
  res.render('adminPage', { result: null , result2: null}); 
}); 

// renders the page upon a POST being received
app.post('/productRequest', (req, res) => {
    const {productID} = req.body;
    console.log(productID);
    adminClient.RequestPackage({ productID: productID},(err, response) => { 
            console.log(response);
            if (err) return res.send("gRPC Error: " + err.message); 

            res.render('adminPage', { result: response.result, result2: null }); 
            console.log(response);
        } 
    )
});

app.post('/depositRequest', (req, res) => {
    const {robotID} = req.body;
    console.log("RobotID", robotID);
    adminClient.RequestBoxDeposit({robotID: robotID}, (err, response) => {
            console.log(response);
            if (err) return res.send("gRPC Error: " + err.message); 

            res.render('adminPage', { result: null, result2: response.result2}); 
            console.log(response.result2);
    })
});

// listens at this port for calls
app.listen(3003, () => { 
    console.log("🌐 GUI running at http://localhost:3003"); 
}); 