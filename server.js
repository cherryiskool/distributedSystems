const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const path = require('path');

const ROBO_PATH = path.join(__dirname, 'proto', 'robotShelfer.proto'); 
const SHELF_PATH = path.join(__dirname, 'proto', 'shelfSensor.proto'); 
const packageRobo = protoLoader.loadSync(ROBO_PATH); 
const packageShelf = protoLoader.loadSync(SHELF_PATH); 

const roboProto = grpc.loadPackageDefinition(packageRobo).robotShelfer;
const shelfProto = grpc.loadPackageDefinition(packageShelf).shelfSensor;
const roboData = require('./roboData.json');
const productData = require('./productData.json');
const { response } = require('express');

// server for robot
const roboServer = new grpc.Server();
roboServer.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => { 
    console.log("✅ gRPC Server running on port 50051"); 
    // roboServer.start(); 
}); 

roboServer.addService(roboProto.RobotShelfer.service, {
    "RobotDriveToShelf": RobotDriveToShelf,
    "RobotTakeBox" : RobotTakeBox
});

// server for shelf robot
const shelfServer = new grpc.Server();
shelfServer.bindAsync("0.0.0.0:50052", grpc.ServerCredentials.createInsecure(), () => { 
    console.log("✅ gRPC Server running on port 50052"); 
    // shelfServer.start(); 
}); 

shelfServer.addService(shelfProto.ShelfSensor.service, {
    "ShelfSense" : ShelfSense
});

// this is necessary for the robotdrive function to be able to call the shelf sensor and ask where the product is
const shelfClient = new shelfProto.ShelfSensor (
    'localhost:50052', 
    grpc.credentials.createInsecure() 
);

// functions for protos

function RobotDriveToShelf (call, callback) {
    const {robotID, productID} = call.request;
    // productIDs = productData.map(product => product.productID);
    let result;
    let shelfResult;
    let productLocation;
    shelfClient.ShelfSense({productID: productID}, (err, response) => {
        console.log("1",response.shelfResult)
        // productLocation = response.shelfResult;
        console.log("qqq",response.shelfResult);
        console.log("id", robotID)
        if (robotID > roboData.length) {
            result = "Invalid Robot Choice";
        } else if (response.shelfResult == "Invalid Product ID") {
            console.log("entered")
            result = response.shelfResult;
        } else if (response.shelfResult in roboData.map(robots => robots.robotID)){
            result = "Location Occupied";
        } else {
            // this finds the robot that was selected
            const movedRobot = roboData.find(robot => robot.robotID == robotID);
            // this updates the data to the new location
            movedRobot.location = parseInt(response.shelfResult);
            result = "Robot Moved Successfully";
            console.log(roboData);
        }
    
    
    
    
        console.log("2",result);
        console.log("3",response.shelfResult);
        callback(null, { result: result})
    });

}

function RobotTakeBox (call, callback) {
    console.log(call)
}

function ShelfSense (call, callback) {
    const{productID} = call.request;
    productIDs = productData.map(product => product.productID);

    // has to match proto file specifications
    let shelfResult;

    if (productID in productIDs == false) {
        shelfResult = "Invalid Product ID";
    } else {
        
        shelfResult = (productData.find(product => product.productID == productID)).productLocation
        console.log(shelfResult);
    }
    console.log("0",shelfResult)
    callback(null, { shelfResult: shelfResult.toString()})
}