const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const path = require('path');
const express = require('express'); 
const app = express(); 

const ARM_PATH = path.join(__dirname, 'proto', 'shelfArm.proto'); 
const packageArm = protoLoader.loadSync(ARM_PATH); 

const armProto = grpc.loadPackageDefinition(packageArm).shelfArm;

const armClient = new armProto.ShelfArm (
    'localhost:50053', 
    grpc.credentials.createInsecure() 
);

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => { 
  res.render('armPage', { result: null }); 
}); 

app.post('/controlArm', (req, res) => {
    const {robotID, productID} = req.body;
    armClient.TransferBox({robotID: robotID, productID: productID},(err, response) => { 
            console.log(response);
            if (err) return res.send("gRPC Error: " + err.message); 
  
            res.render('armPage', { result: response.result }); 
            console.log(response);
        } 
    )
});

app.listen(3002, () => { 
    console.log("🌐 GUI running at http://localhost:3002"); 
}); 