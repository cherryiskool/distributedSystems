const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const path = require('path');
const express = require('express'); 
const app = express(); 

const ROBO_PATH = path.join(__dirname, 'proto', 'robotShelfer.proto'); 
const packageRobo = protoLoader.loadSync(ROBO_PATH); 

const roboProto = grpc.loadPackageDefinition(packageRobo).robotShelfer;


const client = new roboProto.RobotShelfer (
    'localhost:50051', 
    grpc.credentials.createInsecure() 
);

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => { 
  res.render('roboPage', { result: null }); 
}); 

app.post('/controlRobot', (req, res) => {const {robotID, productID} = req.body;
client.RobotDriveToShelf({robotID: robotID, productID: productID},(err, response) => { 
      console.log(response);
      if (err) return res.send("gRPC Error: " + err.message); 

      res.render('roboPage', { result: response.result }); 

    } 
  )
});

app.listen(3000, () => { 
    console.log("🌐 GUI running at http://localhost:3000"); 
}); 