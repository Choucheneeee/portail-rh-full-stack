const mongoose = require("mongoose");

const avanceSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  type: {
    type: String,
    required: true,
    enum: [
      "pret",
      "avance",
    ]
  },
  remboursement :Number,
  motif:String,
montant:Number,
  status:String,
  firstName:String,
  lastName:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Avance", avanceSchema);