const mongoose = require('mongoose');

//create entity schema
const MenuItemSchema = new mongoose.Schema({
    item_name:{
        type: String,
        required: true,
        unique: true,
        maxlength: 20
    },
    category:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true,
        min:1
    },
    cost:{
        type:Number,
        required:true,
        min:1
    },
    item_photo:{
        type:String,
        required:true
    },
    asl_photo:{
        type:String,
        required:true
    },
    item_audio:{
        type:String,
        required:true
    }
});

module.exports = MenuItem = mongoose.model('menu_item',MenuItemSchema);