const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const path = require('path');
const crypto = require('crypto');

//replace methods and uninstall this
const mongo = require('mongodb');
//const fc = require('filecompare');

const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

const methodOverride = require('method-override');
const bodyParser = require('body-parser');

//uninstall this
const fileUpload = require('express-fileupload');

//database URI
const mongoURI = require('../config/keys.js').mongoURI;

//mongoose schema models
const managerModel = require('../models/manager.js');
const customerModel = require('../models/customer.js');
const menuItemModel = require('../models/menu_item.js');
const orderModel = require('../models/order.js');


//Middleware
router.use(bodyParser.json());
router.use(methodOverride('_method'));

//router.use(fileUpload());
//connection to mongoDB
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });


//initialize gridFS 
let gfs;

//connect gridfs to database
conn.once('open', () => {
    //initialize stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});


// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    options: { useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
//multer option that stores file to database
const upload = multer({ storage });

//Alternative multer option that handles route files but does not store them to database
const getFile = multer();

/*****TEST CONNECTION******/
router.get('/', (req, res) => {
    res.status(200).send('Connected...');
});

/*****RETURN REQUESTS ******/

//searches for menu item by text, american sign language equivalent or audio
router.get('/search_items/:field', getFile.single('file'), (req, res) => {
    let searchBy = req.params.field;

    if (searchBy == 'item_name') {
        let itemName = req.body.item_name;

        let query = { item_name: itemName };

        menuItemModel.findOne(query, (err, item) => {
            if (err) {
                res.status(500).send('Unexpected server error');
            }
            else if (!item) {
                res.status(404).json('No item found');
            }
            else {
                item.item_photo = undefined;
                item.asl_photo = undefined;
                item.item_audio = undefined;
                item.__v = undefined;

                res.status(200).json(item);
            }
        });
    }
    else if (searchBy == 'asl_photo' || searchBy == 'item_audio') {
        if (!req.file) {
            return res.status(400).send('No file input found');
        }
        else {
            fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');

            gfs.files.findOne({ md5: fileHash }, (err, file) => {
                if (err)
                    return res.status(500).send('Unexpected server error');

                else if (!file || file.length == 0) {
                    return res.status(404).send('No file found');
                }
                else {
                    menuItemModel.findOne({ [searchBy]: file._id }, (err, item) => {
                        if (err)
                            return res.status(500).send('Unexpected server error');
                        else if (!item) {
                            return res.status(404).send('No item found');
                        }
                        else {
                            res.status(200).json(item);
                        }
                    });
                }
            });
        }
    }
});

//returns all menu items
router.get('/list_items', (req, res) => {
    //fields to be omitted from found objects
    let excludeFields = { item_photo: 0, asl_photo: 0, item_audio: 0, __v: 0 };

    //finds and returns all stored menu items
    menuItemModel.find({}, excludeFields, (err, item) => {
        if (err) {
            res.status(500).send('Unexpected server error');
        }
        //checks if object is undefined or an empty array
        else if (!item || item.length == 0) {
            res.status(404).send('No items found');
        }
        else {
            res.status(200).json(item);
        }
    });
});


//returns a single file for a menu item
//to get menu item image use route '/menu_item/<item object id>/item_photo'
//to get menu item sign language representation use route '/menu_item/<item object id>/asl_photo'
//to get menu item audio use route '/menu_item/<item object id>/item_audio'
router.get('/menu_item/:id/:field', (req, res) => {
    let field = req.params.field;

    //checks if correct field was sent from client
    if (field == 'item_photo' || field == 'asl_photo' || field == 'item_audio') {
        let itemId = req.params.id;

        //searches for item by object id
        menuItemModel.findById(itemId, (err, item) => {
            //error generated if item not found
            if (err) {
                res.status(404).send('Item not found');
            }
            else {
                //generates object id from menu item field
                let fileId = new mongo.ObjectID(item[field]);

                //searches for file in database 
                gfs.files.findOne({ _id: fileId }, (err, file) => {
                    if (err) {
                        return res.status(500).send('Unexpected server error');
                    }
                    //checks for undefined file or empty array
                    else if (!file || file.length === 0) {
                        return res.status(404).send('File not found');
                    }

                    //generates stream from found file and sends to client
                    const readstream = gfs.createReadStream(file.filename);
                    return readstream.pipe(res);
                });
            }
        });
    }
});

/*****ADD REQUESTS ******/

//manager registration
router.post('/add_manager', (req, res) => {
    //initializes object based on manager database schema 
    let newManager = new managerModel();

    newManager.username = req.body.username;
    newManager.password = req.body.password;

    //saves manager object to database
    newManager.save((err) => {
        if (err) {
            res.status(400).send('Error saving manager');
        }
        else {
            //omits field from object when sent to client
            newManager.password = undefined;

            res.status(201).json(newManager);
        }
    });
});

//customer registration
router.post('/add_customer', upload.single('file'), (req, res) => {
    //initializes new object based on customer database schema
    let newCustomer = new customerModel();

    newCustomer.email_address = req.body.email_address;
    newCustomer.first_name = req.body.first_name;
    newCustomer.last_name = req.body.last_name;

    //parses for a text password if no file was sent in request
    if (!req.file || req.file.length == 0) {
        newCustomer.password = req.body.password;

        //Replaces post-validation hook for mongoose db schema
        //stops execution if user is missing password
        if (!req.body.password) {
            return res.status(400).send('Required field missing');
        }
    }
    else {
        newCustomer.digital_id = req.file.id;
    }

    //Saves customer object to database
    newCustomer.save((err) => {
        if (err) {
            //removes uploaded file from database if error encountered while saving record
            if (req.file)
                gfs.remove({ _id: req.file.id, root: 'uploads' });

            res.status(400).send('Email address already in use / Required field missing');
        }
        else {
            res.status(201).send('Customer successfully created...');
        }
    });
});

//uploads up to three different files found in client request
var menuItemUpload = upload.fields([{ name: 'item_image', maxCount: 1 },
{ name: 'sign_language', maxCount: 1 }, { name: 'item_audio', maxCount: 1 }]);

//adds a menu item
router.post('/add_menu_item', menuItemUpload, (req, res) => {
    //checks if client request has all necessary data
    if (!req.files['item_image'] || !req.files['sign_language'] || !req.files['item_audio']) {

        //removes files uploaded from this request if necessary data is missing
        if (req.files['item_image'])
            gfs.remove({ _id: req.files['item_image'][0].id, root: 'uploads' });

        if (req.files['sign_language'])
            gfs.remove({ _id: req.files['sign_language'][0].id, root: 'uploads' });

        if (req.files['item_audio'])
            gfs.remove({ _id: req.files['item_audio'][0].id, root: 'uploads' });

        return res.status(400).send('Invalid user input');
    }

    //initializes and populates object based on menu_item database schema
    let newMenuItem = new menuItemModel();

    newMenuItem.item_name = req.body.item_name;
    newMenuItem.category = req.body.category;
    newMenuItem.stock = req.body.stock;
    newMenuItem.cost = req.body.cost;
    newMenuItem.item_photo = req.files['item_image'][0].id;
    newMenuItem.asl_photo = req.files['sign_language'][0].id;
    newMenuItem.item_audio = req.files['item_audio'][0].id;

    //saves menu item to database
    newMenuItem.save((err) => {
        if (err) {
            //removes files uploaded from this request if necessary data is missing
            if (req.files['item_image'] && req.files['item_image'].length != 0)
                gfs.remove({ _id: req.files['item_image'][0].id, root: 'uploads' });

            if (req.files['sign_language'] && req.files['sign_language'].length != 0)
                gfs.remove({ _id: req.files['sign_language'][0].id, root: 'uploads' });

            if (req.files['item_audio'] && req.files['item_audio'].length != 0)
                gfs.remove({ _id: req.files['item_audio'][0].id, root: 'uploads' });

            res.status(400).send('Invalid user input');
        }
        else {
            //omits fields from object sent back to client
            newMenuItem.item_photo = undefined;
            newMenuItem.asl_photo = undefined;
            newMenuItem.item_audio = undefined;
            newMenuItem.__v = undefined;

            res.status(201).json(newMenuItem);
        }
    });
});

//adds order after validating customer
router.post('/confirm_order/:email_address', upload.single('file'), (req, res) => {
    let email = req.params.email_address;

    let numberOfItems = req.body.number_of_items;
    var itemId = new Array();
    var amountSold = new Array();

    for(i=0; i<numberOfItems; i++){
        itemId.push(req.body.item_id[i]);
        amountSold.push(req.body.quantity[i]);
    }

    if(!numberOfItems || !itemId || !amountSold || 
        itemId.length <= numberOfItems || amountSold <= numberOfItems){
            return res.status(400).send('Invalid user input');
    }

    if (!req.file || req.file.length == 0) {
        let password = req.body.password;

        var query = { email_address: email, password: password };

        //searches for customer record based on query
        customerModel.findOne(query, (err, customer) => {
            if (err) {
                return res.status(500).send('Unexpected server error');
            }
            else if (!customer) {
                return res.status(404).send('Failed to verify customer');
            }
            else {
                res.status(200).send('Customer successfully validated');
            }
        });
    }
    else {
        var query = { email_address: email };

        //searches for customer record based on query
        customerModel.findOne(query, (err, customer) => {
            if (err) {
                return res.status(500).send('Unexpected error');
            }
            else if (!customer) {
                return res.status(404).send('Incorrect login credentials');
            }
            else {
                //if record matching query is found then an object id is created based on digital id field
                let fileId = new mongo.ObjectID(customer.digital_id);

                //uses above fileId to search file database collection 
                gfs.files.findOne({ _id: fileId }, (err, file) => {
                    if (err)
                        return res.status(500).send('Unexpected server error');

                    else if (!file || file.length == 0) {
                        return res.status(404).send('Customer ID not found');
                    }

                    else {
                        //md5 hash of file uploaded by client is generated for comparison
                        fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');

                        //checks if hash of file uploaded by client is the same as file object found from query
                        if (file.md5 == fileHash) {
                            res.status(200).send('Customer successfully validated');
                        }
                        else
                            return res.status(404).send('Failed to verify customer');
                    }
                });
            }
        });
    }

    //saves order made
    saveOrder(itemId, amountSold, numberOfItems);
});
//use next() and save variables to local.res or something / just return status to main router
function saveOrder(idArr, amountArr, n){
    for(i=0; i<n; i++){
        let itemId = idArr[i];
        
        menuItemModel.findById(itemId, (err, foundItem)=>{
            if(err){
                res.status(500).send('Unexpected server error');
            }
            else if(!foundItem){
                res.status(404).send('Item on order does not exist');
            }
            else {
                orderModel.exists({item_id : itemId}, (err, exists)=>{
                    if(err){
                        res.status(500).send('Unexpected server error');
                    }
                    else if(exists == true){
                        //*************EDIT************/
                        orderModel.findOneAndUpdate({item_id: itemId}, (err)=>{

                        });
                    }
                    else{
                        let newOrder = new orderModel();
                        
                        newOrder.item_id = itemId;
                        newOrder.quantity_sold = amountArr[i];
                        newOrder.total_sales = foundItem.cost * amountArr[i];

                        newOrder.save((err)=>{
                            if(err){
                                res.status(404).send('Failed to save order');
                            }
                            else{
                                res.status(200).send('Successfully added order');
                            }
                        });
                    }
                });
            }
            
        });
    }
}

/*****VALIDATION REQUESTS ******/

//validates manager login
router.post('/login_manager', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    //checks for manager record that matches request username and password
    let query = { username: username, password: password };

    //searches for and returns manager record based on query
    managerModel.findOne(query, (err, manager) => {
        if (err) {
            res.status(500).send('Unexpected error');
        }
        else if (!manager) {
            res.status(404).send('Incorrect login credentials');
        }
        else
            res.status(200).send(manager.username);
    });
});

//validates customer login
router.post('/login_customer', getFile.single('file'), (req, res) => {
    let email = req.body.email_address;

    //checks if file was sent in request to decide what type of query to use
    if (!req.file || req.file.length == 0) {
        //parses for text password if no file was uploaded
        var password = req.body.password;
        var query = { email_address: email, password: password };

        //searches for customer record based on query
        customerModel.findOne(query, (err, customer) => {
            if (err) {
                res.status(500).send('Unexpected error');
            }
            else if (!customer) {
                res.status(404).send('Incorrect login credentials');
            }
            else {
                //omits fields from object sent back to client
                customer.password = undefined;
                customer.__v = undefined;

                res.status(200).json(customer);
            }
        });
    }
    else {
        //only uses email for querying in the customer database if file password was uploaded
        var query = { email_address: email };

        //searches for customer record based on query
        customerModel.findOne(query, (err, customer) => {
            if (err) {
                res.status(500).send('Unexpected error');
            }
            else if (!customer) {
                res.status(404).send('Incorrect login credentials');
            }
            else {
                //if record matching query is found then an object id is created based on digital id field
                let fileId = new mongo.ObjectID(customer.digital_id);

                //uses above fileId to search file database collection 
                gfs.files.findOne({ _id: fileId }, (err, file) => {
                    if (err)
                        return res.status(500).send('Unexpected server error');

                    if (!file || file.length == 0) {
                        return res.status(404).send('Incorrect login credentials');
                    }

                    //if file object is found from query
                    //md5 hash of file uploaded by client is generated for comparison
                    fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');

                    //checks if hash of file uploaded by client is the same as file object found from query
                    if (file.md5 == fileHash) {
                        //omits fields from object sent back to client
                        customer.digital_id = undefined;
                        customer.__v = undefined;

                        res.status(200).json(customer);
                    }
                    else {
                        res.status(404).send('Account not found');
                    }
                });
            }
        });
    }
});

/*****EDITING REQUESTS ******/

//modifies a menu items stock or cost
//to modify cost use route '/edit_item/cost'
//to modify stock use route '/edit_item/stock'

router.post('/edit_item/:field', (req, res) => {
    let field = req.params.field;

    //checks if correct fields were sent in request url
    if (field == 'stock' || field == 'cost') {
        let newValue = req.body.new_value;
        let itemId = req.body.id

        //searches for menu item and updates field value
        menuItemModel.findByIdAndUpdate(itemId, { $set: { [field]: newValue } }, { useFindAndModify: false },
            (err, item) => {
                if (err) {
                    res.status(404).send('Item not found');
                }
                else {
                    //omits fields from object sent back to client
                    item.item_photo = undefined;
                    item.asl_photo = undefined;
                    item.item_audio = undefined;
                    item.__v = undefined;

                    res.status(200).json(item);
                }
            });
    }
});

/*****DELETE REQUESTS ******/

//deletes manager record
router.post('/delete_manager', (req, res) => {

    let username = req.body.username;
    let password = req.body.password;

    let query = { username: username, password: password };

    //searches for and deletes a single record matching the above query
    managerModel.findOneAndDelete(query, function (err, manager) {
        if (err) {
            res.status(404).send('Record not found');
        }
        else {
            res.status(200).send('Manager account deleted');
        }
    });
});

//deletes menu item
router.post('/delete_menu_item/:id', (req, res) => {
    let itemId = req.params.id;

    //searches for and deletes menu item matching above uploaded id
    menuItemModel.findByIdAndDelete(itemId, (err, menuItem) => {
        if (err) {
            res.status(404).send('Item not found');
        }
        else {
            let itemPhotoId = menuItem.item_photo;
            let aslPhotoId = menuItem.asl_photo;
            let itemAudioId = menuItem.item_audio;

            try {
                //deletes files associated with menu item if it was found
                gfs.remove({ _id: itemPhotoId, root: 'uploads' });
                gfs.remove({ _id: aslPhotoId, root: 'uploads' });
                gfs.remove({ _id: itemAudioId, root: 'uploads' });
            } catch (error) {
                res.write('Error deleting files');
            }

            res.status(200).send('Item successfully deleted');
        }
    });
});

module.exports = router;