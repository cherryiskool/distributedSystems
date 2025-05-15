const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const path = require('path');
const express = require('express'); 
const app = express(); 

const ADMIN_PATH =  path.join(__dirname, 'proto', 'admin.proto');
const packageAdmin = protoLoader.loadSync(ADMIN_PATH);

const adminProto = grpc.loadPackageDefinition(packageAdmin).admin;

const adminClient = new adminProto.Admin (
    'localhost:50054', 
    grpc.credentials.createInsecure() 
);

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => { 
  res.render('adminPage', { result: null }); 
}); 

app.post('/productRequest', (req, res) => {
    const {productID} = req.body;
    console.log(productID);
    adminClient.RequestPackage({ productID: productID},(err, response) => { 
            console.log(response);
            if (err) return res.send("gRPC Error: " + err.message); 
  
            res.render('adminPage', { result: response.result }); 
            console.log(response);
        } 
    )
});

app.listen(3003, () => { 
    console.log("🌐 GUI running at http://localhost:3003"); 
}); 