const mongoose = require("mongoose");
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");


console.log(process.env.MONGO_URI);
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI,{
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connecté !");
    await getSystemUser();

  } catch (error) {
    console.error("Erreur de connexion à MongoDB", error);
    process.exit(1);
  }
};

async function getSystemUser() {
  let systemUser = await User.findOne({ email: 'system@system.com' });
  if (!systemUser) {
    systemUser = new User({
      firstName: 'System',
      lastName: 'User',
      email: 'system@system.com',
      password: process.env.SYSTEM_PASSWORD,
      role: 'admin',
      isVerified: true,
      isApproved: true
    });
    await systemUser.save();
  }
  return systemUser;
}

module.exports = connectDB;

