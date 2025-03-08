// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const InvoiceSchema = new Schema({
//     student:{
//         type:Schema.Types.ObjectId,
//         ref:'student'
//     },
//     title:{
//         type:String,
//         default:'Mess Fee'
//     },
//     amount:{
//         type:Number,
//         required:true
//     },
//     status:{
//         type:String,
//         default:'pending'
//     },
//     date:{
//         type:Date,
//         default:Date.now
//     }
// })

// module.exports = Invoice = mongoose.model('invoice',InvoiceSchema);


const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "student", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid", "approved", "declined"], default: "pending" },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("invoice", InvoiceSchema);
