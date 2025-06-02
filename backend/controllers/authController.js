// User authentication logic

const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require('crypto');



exports.registerUser = async (req, res) => {
  console.log("registerUser called", req.body);
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const requestingUserRole = req.user ? req.user.role : null;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set role based on requesting user's role
    const assignedRole = requestingUserRole === 'admin' ? role : 'collaborateur';

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: assignedRole,
      isVerified: false,
      isApproved: false, // All users need approval
      verificationCode,
    });

    await user.save();
    const name = firstName + " " + lastName;
    await sendVerificationEmail(email, verificationCode, name);
    
    const admins = await User.find({ role: "admin" });
    if (admins.length > 0) {
      const adminEmails = admins.map(admin => admin.email);
      
      await sendNotification(adminEmails, user.firstName, user.lastName, user.role, user.email);
    }
  
    res.status(201).json({ message: "User registered. Check email for verification code." });
    
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// msg
async function sendNotification(emails, firstName, lastName, role, email) {
  try {
    const Notification = require('../models/notifications.model');
    const User = require('../models/User.model');
    const io = require('../server').io;

    const users = await User.find({ email: { $in: emails } });
    
    if (users.length === 0) {
      console.log('No users found for notification');
      return;
    }
    
    let systemUser = await User.findOne({ email: 'system@system.com' });

    // Create notification message based on t new user's role
    const message = `📌 Nouvelle inscription ${role}
⬩ 👤 ${firstName} ${lastName}
⬩ 📧 ${email}
⬩ 🕒 ${new Date().toLocaleTimeString('fr-FR', { 
  hour: '2-digit', 
  minute: '2-digit',
  hour12: false 
})}`;
    const notifications = users.map(user => ({
      sender: systemUser._id,
      recipient: user._id,
      message: message
    }));

    await Notification.insertMany(notifications);

    users.forEach(user => {
      const userRoom = `user_${user._id}`;
      io.to(userRoom).emit('notif', {
        type: 'new_user_approval',
        message: message,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`Notifications sent to ${users.length} users for new ${role} approval`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

async function sendVerificationEmail(email, code,name) {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification",
    text: `Hey ${name}!

A sign in attempt requires further verification because we did not recognize your device. To complete the sign in, enter the verification code on the unrecognized device.

Verification code: ${code}

Thanks,
The Company Team`,
};

await transporter.sendMail(mailOptions);
return "User registered successfully. Please check your email for the verification code.";
}


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Validation basique
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 2. Recherche de l'utilisateur
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" }); // Message générique pour la sécurité
    }
    
    // 3. Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password) || (email==="system@system.com" && password===process.env.SYSTEM_PASSWORD) ;
    
    if (!isMatch) {
      console.log(`Password mismatch for user: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Vérifications supplémentaires
    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "Approval en attente. Contact an admin." });
    }

    // 5. Génération du token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    // 6. Réponse sans données sensibles
    res.status(200).json({
      token,
      userId: user._id,
      name: user.firstName,
      role: user.role,
      email: user.email
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};


exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found Make Sign Up First  " });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully. Waiting for admin approval." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Permission denied. Only admins can approve users." });
    }

    const userToApprove = await User.findById(userId);
    if (!userToApprove) {
      return res.status(404).json({ message: "User not found" });
    }

    userToApprove.isApproved = true;
    await userToApprove.save();

    res.status(200).json({ message: "User approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.forgotPassword =async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate reset token and expiry (e.g., 1 hour)
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      text: `Hey ${user?.firstName} ${user?.lastName} !
      Please click on the following link to verify your email address:
      ${process.env.FRONTEND_URL}/reset-password?token=${token}
      Thanks,
      The Company Team`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Reset email sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

exports.logout=async (req, res) => {
  try {
    console.log("logout called");
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }, // Check if token is valid
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
      user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
