const mongoose = require("mongoose");

const congeSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },  
  type: {
    type: String,
    required: true,
    enum: [
      "annuel",
        "maladie",
        "sans_solde",
        "maternité",
        "paternité",

    ]
  },
  date_Debut:Date,
  date_Fin:String,
  motif:String,
  status:String,
  firstName:String,
  lastName:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Conge", congeSchema);