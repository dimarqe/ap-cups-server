const mongoose = require('mongoose');

//create entity schema
const OrderSchema = new mongoose.Schema({
    item_id:{
        type: String,
        required: true,
        index: true
    },
    quantity_sold:{
        type: Number,
        default: 0
    },
    total_sales:{
        type: Number,
        default:0
    }
});

module.exports = Order = mongoose.model('order',OrderSchema);