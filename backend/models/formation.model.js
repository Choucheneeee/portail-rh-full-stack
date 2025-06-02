const mongoose = require("mongoose");

const formationSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    titre:{
        type:String,
        require:true
    },
  type: {
    type: String,
    required: true,
    enum: [
      "internal",
      "external",
    ]
  },
  date_Debut:Date,
  date_Fin:String,
  description:String,
  organisme:String,
  cout:Number,
  status:String,
  firstName:String,
  lastName:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Formation", formationSchema);