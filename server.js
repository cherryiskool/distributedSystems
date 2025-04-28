const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const path = require('path');

const ROBO_PATH = path.join(__dirname, 'proto', 'robotShelfer.proto'); 
const SHELF_PATH = path.join(__dirname, 'proto', 'shelfSensor.proto'); 
const ARM_PATH = path.join(__dirname, 'proto', 'shelfArm.proto');
const packageRobo = protoLoader.loadSync(ROBO_PATH); 
const packageShelf = protoLoader.loadSync(SHELF_PATH); 
const packageArm = protoLoader.loadSync(ARM_PATH);


const roboProto = grpc.loadPackageDefinition(packageRobo).robotShelfer;
const shelfProto = grpc.loadPackageDefinition(packageShelf).shelfSensor;
const armProto = grpc.loadPackageDefinition(packageArm).shelfArm;
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
    "RobotTakeBox" : RobotTakeBox,
    "RobotLocation": RobotLocation
});

// server for shelf sensor robot
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




// necessary for shelf arm to call robot 
const armClient = new roboProto.RobotShelfer (
    'localhost:50053', 
    grpc.credentials.createInsecure() 
);



// server for arm
const armServer = new grpc.Server();
armServer.bindAsync("0.0.0.0:50053", grpc.ServerCredentials.createInsecure(), () => { 
    console.log("✅ gRPC Server running on port 50053"); 

}); 

armServer.addService(armProto.ShelfArm.service, {
    "TransferBox": TransferBox
});


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
    
}

function RobotLocation (call, callback) {
    const{robotID} = call.request;

    locationResult = (roboData.find(robot => robot.robotID == robotID)).location;

    callback(null, {robotLocation: locationResult})
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

function TransferBox (call, callback) {
    const{robotID, productID} = call.request;
}