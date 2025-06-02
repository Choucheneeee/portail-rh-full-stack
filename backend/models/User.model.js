const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  cin: {
    type: Number,
    required: false,
    default: null,
    unique: false,
  },
  email: { 
    type: String, 
    unique: true, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  profileImage: { 
    type: String, 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  verificationCode: String,
  role: { 
    type: String, 
    enum: ["admin", "collaborateur", "rh"], 
    required: true 
  },
  resetToken: String,
  resetTokenExpiration: Date,
  personalInfo: {
    phone: String,
    countryCode: String,
    address: String,
    birthDate: Date
  },
  financialInfo: {
    RIB: String,
    taxId: String,
    CNSS: String,
    paymentMethod: String,
    contractType: {
      type: String,
      enum: ['CDI', 'CDD',"Stage"],
      default: 'CDI'
    },
    contractEndDate: {
      type: Date,
      validate: {
        validator: function(value) {
          if (this.financialInfo && this.financialInfo.contractType === 'CDD') {
            if (!value) return false;
            return value > this.professionalInfo?.hiringDate;
          }
          return true;
        },
        message: 'Contract end date must be provided and after hiring date for CDD contracts'
      }
    },
    transportAllowance: Number
  },
  professionalInfo: {
    position: String,
    department: String,
    hiringDate: Date,
    salary: Number,
    jobDescription: {
      responsibilities: [String],
      qualifications: [String],
      effectiveDate: Date
    }
  },
  socialInfo: {
    maritalStatus: String,
    children: Number
  },
  timeOffBalance: { 
    type: Number, 
    default: 28 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  signature: {
    type: String,  // Stores Base64 or URL
    default: null
  }
});

// Add a pre-save middleware to clear contractEndDate if contract type is CDI
UserSchema.pre('save', function(next) {
  if (this.financialInfo && this.financialInfo.contractType === 'CDI') {
    this.financialInfo.contractEndDate = undefined;
  }
  next();
});

// Add a compound index for cin that only applies when cin is not null
UserSchema.index({ cin: 1 }, { 
  unique: true,
  sparse: true,
  partialFilterExpression: { cin: { $type: "number" } }
});

module.exports = mongoose.model("User", UserSchema);