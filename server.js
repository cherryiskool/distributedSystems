const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const path = require('path');

const ROBO_PATH = path.join(__dirname, 'proto', 'robotShelfer.proto'); 
const SHELF_PATH = path.join(__dirname, 'proto', 'shelfSensor.proto'); 
const ARM_PATH = path.join(__dirname, 'proto', 'shelfArm.proto');
const ADMIN_PATH =  path.join(__dirname, 'proto', 'admin.proto');
const packageRobo = protoLoader.loadSync(ROBO_PATH); 
const packageShelf = protoLoader.loadSync(SHELF_PATH); 
const packageArm = protoLoader.loadSync(ARM_PATH);
const packageAdmin = protoLoader.loadSync(ADMIN_PATH);

// this loads all of the proto files
const roboProto = grpc.loadPackageDefinition(packageRobo).robotShelfer;
const shelfProto = grpc.loadPackageDefinition(packageShelf).shelfSensor;
const armProto = grpc.loadPackageDefinition(packageArm).shelfArm;
const adminProto = grpc.loadPackageDefinition(packageAdmin).admin;

// this loads the data required (the robots and their position for example)
const roboData = require('./roboData.json');
const productData = require('./productData.json');
const { response } = require('express');

// server for robot, this is required so that other services can call this one
const roboServer = new grpc.Server();
roboServer.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => { 
    console.log("✅ gRPC Server running on port 50051"); 
    // roboServer.start(); 
}); 

// this adds the services to the server so it can recognise them
roboServer.addService(roboProto.RobotShelfer.service, {
    "RobotDriveToShelf": RobotDriveToShelf,
    "RobotTakeBox" : RobotTakeBox,
    "RobotLocation": RobotLocation,
    "FreeRobot": FreeRobot,
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
const roboClient = new roboProto.RobotShelfer (
    'localhost:50051', 
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

// server for admin
const adminServer = new grpc.Server();
adminServer.bindAsync("0.0.0.0:50054", grpc.ServerCredentials.createInsecure(), () => {
    console.log("✅ gRPC Server running on port 50054");
})

adminServer.addService(adminProto.Admin.service, {
    "RequestPackage": RequestPackage
})

// necessary for admin to call arm
const armClient = new armProto.ShelfArm (
    'localhost:50053', 
    grpc.credentials.createInsecure() 
);

// functions for protos


// this controls the robot to drive to the product location
function RobotDriveToShelf (call, callback) {
    const {robotID, productID} = call.request;
    // productIDs = productData.map(product => product.productID);
    let result;
    // let shelfResult;
    // let productLocation;
    shelfClient.ShelfSense({productID: productID}, (err, response) => {
        console.log("1",response.shelfResult)
        // productLocation = response.shelfResult;
        console.log("qqq",response.shelfResult);
        console.log("id", robotID)
        if (robotID > roboData.length || robotID < 1) {
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

// this function would relate to some sort of clasp on the robot that secures the boxes placed on it
function RobotTakeBox (call, callback) {
    const{robotID} = call.request;
    let result;
    console.log("RobotTakeBox RobotID", robotID);
    console.log(roboData.map(robot => robot.robotID));
    console.log(robotID == 5);
    console.log(5 in roboData.map(robot => robot.robotID));
    if (robotID in roboData.map(robot => robot.robotID) == true) {
        (roboData.find(robot => robot.robotID == robotID)).hasItem = true;
        console.log("RobotID is correct for RobotTakeBox")
        result = "Product Transferred Successfully";
    } else if (robotID == 5) {
        (roboData.find(robot => robot.robotID == 5)).hasItem = true;
        console.log("RobotID is correct for RobotTakeBox")
        result = "Product Transferred Successfully";
    } else {
        result = "Invalid Robot Choice";
    }
    console.log(roboData);
    callback(null, {result: result})
    
}

// function that returns the location of a robot - will be by the arm to know if the robot is in place
function RobotLocation (call, callback) {
    const{robotID} = call.request;
    let locationResult;
    if (robotID > roboData.length || robotID < 1) {
        locationResult = "Invalid Robot Choice";
    } else {
        locationResult = (roboData.find(robot => robot.robotID == robotID)).location;

    }
    
    callback(null, {robotLocation: locationResult})
}

// this function returns all of the robots that are currently able to pick up boxes
function FreeRobot (call,callback) {
    robotIDs = roboData.map(robot => robot.robotID)
    let availableBot;
    for (i= 0; i < robotIDs.length; i++) {
        if (roboData[i].hasItem == false) {
            availableBot = i + 1;
            console.log(availableBot);
            console.log("numba",i);
            break
        } else if (i + 1 == robotIDs.length) {
            availableBot = "No Robots are Free";
        }
    }
    callback(null, {FreeResult: availableBot});
}

// finds the location of the product given its id
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

// this function will transfer a product to a robot (not actually since this is all theoretical)
function TransferBox (call, callback) {
    const{robotID, productID} = call.request;
    let robotLocation;
    let result;
    let result1;
    let result2;

    // arm asks robot where it is at the moment
    roboClient.RobotLocation({robotID: robotID}, (err, response) => {
        result1 = response.robotLocation;
        // console.log("1111111",result1);

        // arm asks shelf sensors where the product is
        shelfClient.ShelfSense({productID: productID}, (err, response) => {
            result2 = response.shelfResult;
            console.log(result2)

            // 1 + 2 if the other services are returning errors then arm returns error
            // 3 if no errors but the locations do not match up then product may not be transferred
            // 4 otherwise transfer box to robot (robot take box refers to handles on the robot to grasp box on top of it - not an actual arm)
            if (result1 == "Invalid Robot Choice") {
                result = result1;
                callback(null,{result: result})
            } else if (result2 == "Invalid Product ID") {
                result = result2;
                callback(null,{result: result})
            } else if (result1 != result2) {
                result = "Robot not at Product Location";
                callback(null,{result: result})
            } else {
                // result = "Product Transfered Successfully";
                // grasp item and update data to show that the robot has an item
                roboClient.RobotTakeBox({robotID: robotID}, (err, response) => {
                    result = response.result;
                    console.log("Skyrim", result);
                    callback(null, {result: "Product Transferred Succesfully"});
                })
            }
            console.log("Current Robot Data: ",roboData);

        })
    })
}

function RequestPackage (call, callback) {
    const{productID} = call.request;
    console.log("product", productID)
    let robotID;
    roboClient.FreeRobot({}, (err, response) => {
        console.log(response.FreeResult);
        robotID = response.FreeResult;
        if (response.FreeResult == "No Robots are Free") {
            console.log("RequestPackage NoRobotsError");
            callback(null, {result: response.FreeResult});
        } else {
            roboClient.RobotDriveToShelf({robotID: robotID, productID: productID}, (err, response) => {
                if (response.result == 'Invalid Product ID') {
                    callback(null, {result: response.result});
                } else {
                    armClient.TransferBox({robotID: robotID, productID: productID}, (err, response) => {
                        console.log("TransferBox Response", response);
                        roboClient.RobotTakeBox({robotID: robotID}, (err, response) => {
                            console.log("RobotTakeBox Response", response);
                            callback(null, {result: response.result})
                })
            })
            }

        })
        }

    });




}