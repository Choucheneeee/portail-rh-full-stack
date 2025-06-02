const User = require("../models/User.model");
const Request = require("../models/document.model");
const Formation = require("../models/formation.model");
const Conge = require("../models/conge.model");
const Avance = require("../models/avance.model");

exports.getuser = async (req, res) => {
  const userId = req.user.id; 
  console.log("userId", userId);
  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      res.json(user);
    })
    .catch(() => {
      res.status(500).send('Error fetching user');
    });
};

exports.getuserRh = async (req, res) => {
  const userId = req.params.userId; // Get userId from request parameters
  console.log("userId", userId);
  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      res.json(user);
    })
    .catch(() => {
      res.status(500).send('Error fetching user');
    });
};

const updateuser = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.file) {
      req.body.profileImage = `/uploads/${req.file.filename}`;
    }

    // 2. Convert date fields
    if (req.body.personalInfo?.birthDate) {
      req.body.personalInfo.birthDate = new Date(
        req.body.personalInfo.birthDate.split('/').reverse().join('-')
      );
    }
    
    if (req.body.professionalInfo?.hiringDate) {
      req.body.professionalInfo.hiringDate = new Date(
        req.body.professionalInfo.hiringDate.split('/').reverse().join('-')
      );
    }

    // 3. Handle contract type and end date
    if (req.body.financialInfo?.contractType) {
      // Validate contract type
      if (!['CDI', 'CDD'].includes(req.body.financialInfo.contractType)) {
        return res.status(400).json({
          error: 'Contract type must be either CDI or CDD'
        });
      }

      // Handle contract end date for CDD
      if (req.body.financialInfo.contractType === 'CDD') {
        if (!req.body.financialInfo.contractEndDate) {
          return res.status(400).json({
            error: 'Contract end date is required for CDD contracts'
          });
        }

        // Convert contract end date
        const endDate = new Date(req.body.financialInfo.contractEndDate);
        const hiringDate = req.body.professionalInfo?.hiringDate ? 
          new Date(req.body.professionalInfo.hiringDate) :
          (await User.findById(userId)).professionalInfo.hiringDate;

        if (endDate <= hiringDate) {
          return res.status(404).json({
            error: 'Contract end date must be after hiring date'
          });
        }

        req.body.financialInfo.contractEndDate = endDate;
      } else {
        // For CDI, explicitly set contractEndDate to null
        req.body.financialInfo.contractEndDate = null;
      }
    }

    // 4. Update user with all fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Error updating user',
      details: error.message
    });
  }
};
exports.updateuserRh = async (req, res) => {
  try {
    const userId = req.params.userId; // Get userId from request parameters

    if (req.file) {
      req.body.profileImage = `/uploads/${req.file.filename}`;
    }

    // 2. Convert date fields

    
    if (req.body.professionalInfo?.hiringDate) {
      req.body.professionalInfo.hiringDate = new Date(
        req.body.professionalInfo.hiringDate.split('/').reverse().join('-')
      );
    }

    // 3. Handle contract type and end date
    if (req.body.financialInfo?.contractType) {
      // Validate contract type
      if (!['CDI', 'CDD',"Stage"].includes(req.body.financialInfo.contractType)) {
        return res.status(400).json({
          error: 'Contract type must be either CDI or CDD or Stage'
        });
      }

      // Handle contract end date for CDD
      if (req.body.financialInfo.contractType === 'CDD' || req.body.financialInfo.contractType === 'Stage') {
        if (!req.body.financialInfo.contractEndDate) {
          return res.status(400).json({
            error: 'Contract end date is required for CDD contracts'
          });
        }

        // Convert contract end date
        const endDate = new Date(req.body.financialInfo.contractEndDate);
        const hiringDate = req.body.professionalInfo?.hiringDate ? 
          new Date(req.body.professionalInfo.hiringDate) :
          (await User.findById(userId)).professionalInfo.hiringDate;

        if (endDate <= hiringDate) {
          return res.status(404).json({
            error: 'Contract end date must be after hiring date'
          });
        }

        req.body.financialInfo.contractEndDate = endDate;
      } else {
        // For CDI, explicitly set contractEndDate to null
        req.body.financialInfo.contractEndDate = null;
      }
    }

    // 4. Update user with all fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Error updating user',
      details: error.message
    });
  }
};

exports.updateuser = updateuser;


exports.allusers = async (req, res) => {
  try { 
    // Get only collaborateur users (verified and unverified)
    const verifiedUsers = await User.find({ 
      role: "collaborateur"
    });
    const rh= await User.find({
      isVerified: true,
      role: "rh"
    });


    const unverifiedUsers = await User.find({ 
      isVerified: false, 
      role: "collaborateur" 
    });

    const requests = await Request.countDocuments();
    const formations = await Formation.countDocuments();
    const conges = await Conge.countDocuments();
    const avances = await Avance.countDocuments();


    const output = {
      request: requests+formations+conges+avances,
      Numbercollaborators: verifiedUsers.length,
      collaborator: verifiedUsers,
      unverifiedUsers: unverifiedUsers,
      rh:rh
    };

    res.json(output);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching users");
  }
};
exports.addsignature = async (req, res) => {
  try {
    const user=req.user.id;
    console.log("signatur",req.body);
    const signature=req.body.signature;
    const userToUpdate = await User.findById(user);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }
    userToUpdate.signature = signature;
    await userToUpdate.save();
    res.status(200).json({ message: "Signature added successfully" });

  }
  catch(error){
    console.log(error);
  }
}

exports.allusersRh = async (req, res) => {
  try { 
    // Get only collaborateur users (verified and unverified)
    const verifiedUsers = await User.find({ 
      role: "collaborateur",
      isVerified: true,
      isApproved: true

    });
   
    const requests = await Request.countDocuments();
    const formations = await Formation.countDocuments();
    const conges = await Conge.countDocuments();
    const avances = await Avance.countDocuments();


    const output = {
      request: requests+formations+conges+avances,
      Numbercollaborators: verifiedUsers.length,
      collaborator: verifiedUsers,
    };

    res.json(output);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching users");
  }
};

exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.body; // Get both userId and approve from the request body

    // Ensure only admin can approve/disapprove
    if (req.user.role !== "admin" && req.user.role!="rh") {
      return res.status(403).json({ message: "Unauthorized You must have Admin Role" });
    }

    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: "Missing userId field" });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if(user.isApproved==true){
      return res.status(400).json({ message: "User already approved" });
    }
    // Update the user's isApproved field to true
    user.isApproved = true;
    await user.save(); // Save the changes

    return res.status(200).json({
      message: "User approved successfully" ,
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error approving user" });
  }
};

exports.deleteuser = async (req, res) => {
  try {
    const _id = req.params.userId; // Ensure that `authMiddleware` sets `req.user`

    const deletedUser = await User.findByIdAndDelete(_id);

    if (!deletedUser) {
      return res.status(404).send('User not found');
    }

    res.json("User deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting user');
  } 
  };




