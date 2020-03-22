const mongoose = require('mongoose');

//create entity schema
const ManagerSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        maxlength: 15
    },
    password:{
        type: String,
        required: true,
        maxlength: 15
    }
});

module.exports = Manager = mongoose.model('manager',ManagerSchema);