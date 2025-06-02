const User = require("../models/User.model");




exports.allusers = async (req, res) => {
  try { 

    const verifiedUsers = await User.find({ 
      isVerified: true,
      isApproved:true,
      role: "collaborateur"
    });
    const rh= await User.find({
      isVerified: true,
      isApproved:true,
      role: "rh"
    });
    const admin= await User.find({  
        isVerified: true,
        role: "admin"
        });


    const unverifiedUsers = await User.find({ 
      isApproved: false, 
    });


    const output = {
      collaborator: verifiedUsers,
      rh:rh,
      admin:admin,
      unverifiedUsers:unverifiedUsers
    };

    res.json(output);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching users");
  }
};

exports.updateruser = async (req, res) => {
    try{    
        const userId=req.params.id;
        const newRole=req.body.newRole;
        const updatedUser = await User.findById(userId);
        console.log(req.params);
        console.log(req.body);
        console.log(userId);
        console.log(newRole);
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        updatedUser.role = newRole;
        await updatedUser.save();
        res.status(200).json({ message: "User updated successfully", user: updatedUser });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}
  exports.deleteuser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
    }

exports.getData =async(req,res)=>{
  try{
    const verifiedUsers = await User.find({ 
          isVerified: true,
          role: "collaborateur"
        });
    const verifiedRh = await User.find({ 
          isVerified: true,
          role: "rh"
        });
    const verifiedAdmin = await User.find({ 
          isVerified: true,
          role: "admin"
        });
      
        const output = {
          Numbercollaborators: verifiedUsers.length,
          NumberRh: verifiedRh.length,
          NumberAdmin: verifiedAdmin.length,
        };
    res.json(output);

  }
  catch{
    console.error(error);

    res.status(500).send("Error fetching users");

  }
}