const mongoose = require('mongoose');

//create entity schema
const CustomerSchema = new mongoose.Schema({
    email_address:{
        type: String,
        required: true,
        unique: true
    },
    first_name:{
        type: String,
        required: true
    },
    last_name:{
        type: String,
        required: true
    },
    password:{
        type: String
    },
    digital_id:{
        type:String
    },
    account_balance:{
        type: Number,
        default: 500
    }
});

module.exports = Customer = mongoose.model('customer',CustomerSchema);