const Message = require('../models/messagesModel');
const User = require('../models/User.model'); // Assuming you have a User model

// Send a new message
exports.sendMessage = async (req, res) => {
  console.log("message",req.body)
  try {
    const { receiver, content,sender,timestamp} = req.body;

    const receiveruser = await User.findById(receiver);
    if (!receiveruser) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const message = new Message({
      sender: sender,
      receiver: receiver,
      content:content,
      timestamp: timestamp,
    });

    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.log(error,"error")
    res.status(500).json({ error: error.message });
  }
};

exports.getalluser = async (req, res) => {
  try {
    const collaborator = await User.find({
      role: "collaborateur",
      isVerified: true,
      isApproved: true
    })
    const rh = await User.find({
      role: "rh",
      isVerified: true,
      isApproved: true
    });
    const output = {
      collaborator: collaborator,
      rh: rh
    };
    
    res.json(output);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.query.currentUserId;
    

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username avatar') // Adjust fields as needed
    .populate('receiver', 'username avatar');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a message (soft delete or hard delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    console.log(req.user,"req.user")
    console.log(currentUserId,"currentUserId")
    console.log(id,"id")
    const message = await Message.findByIdAndDelete({ _id: id, sender: currentUserId });
    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};