const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true },
  ip: { type: String, required: true },
});

const Stock = mongoose.model("Stock", stockSchema);

module.exports = Stock;
