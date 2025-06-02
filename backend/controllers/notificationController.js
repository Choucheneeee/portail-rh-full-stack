const notification = require('../models/notifications.model');
const User = require("../models/User.model");

exports.createNotification = async (req, res) => {
   try {
    const sender = req.user;
    const { message, recipientId } = req.body;

    if (sender.role === 'rh') {
      if (!recipientId) {
        return res.status(400).json({ message: 'Recipient ID is required' });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient || recipient.role !== 'collaborateur') {
        return res.status(400).json({ message: 'Invalid collaborator ID' });
      }
      const notifications = new notification({
        sender: sender.id,
        recipient: recipientId,
        message
      });

      await notifications.save();
      return res.status(201).json(notification);
    }
    else if (sender.role === 'collaborateur') {

        const rhs = await User.find({ role: 'rh' });

      if (rhs.length === 0) {
        return res.status(404).json({ message: 'No rhs found' });
      }
      //msg
      const notifications = rhs.map(rh => ({
        sender: sender.id,
        recipient: rh._id,
        message
      }));

      await notification.insertMany(notifications);
      return res.status(201).json({ message: 'Notification sent to all rhs' });
    }

    return res.status(403).json({ message: 'Unauthorized role' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
    
exports.getNotifications =async (req,res)=>{
  try {
    const userId=req.params.userId
    const notifications = await notification.find({ recipient: userId }).sort({ createdAt: -1 });
    if (!notifications) {
      return res.status(404).json({ message: 'No notifications found' });
    }
    return res.status(200).json(notifications);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
} 

//msg