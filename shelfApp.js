const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const path = require('path');
const express = require('express'); 
const app = express(); 

const SHELF_PATH = path.join(__dirname, 'proto', 'shelfSensor.proto'); 
const packageShelf = protoLoader.loadSync(SHELF_PATH); 

const shelfProto = grpc.loadPackageDefinition(packageShelf).shelfSensor;

const shelfClient = new shelfProto.ShelfSensor (
    'localhost:50052', 
    grpc.credentials.createInsecure() 
);

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => { 
  res.render('shelfPage', { shelfResult: null }); 
}); 

app.post('/controlShelf', (req, res) => {
    const {productID} = req.body;
    shelfClient.ShelfSense({productID: productID},(err, response) => { 
            console.log(response);
            if (err) return res.send("gRPC Error: " + err.message); 
  
            res.render('shelfPage', { shelfResult: response.shelfResult }); 
            console.log(response.shelfResult);
        } 
    )
});

app.listen(3001, () => { 
    console.log("🌐 GUI running at http://localhost:3001"); 
}); 