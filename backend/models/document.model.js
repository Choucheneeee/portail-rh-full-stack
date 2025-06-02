const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  type: {
    type: String,
    required: true,
    enum: [
      "attestation",
      "fiche_paie",
      "attestation_de_stage",
    ]
  },
  firstName:String,
  lastName:String,
  periode:{
    type:String,
    enum:[
      "mensuel",
      "annuel"
    ]
  },
  mois:String,
  annee:String,
 documenttDetails:String,
  status:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Document", documentSchema);