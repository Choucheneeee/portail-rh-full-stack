const Conge = require("../models/conge.model");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const Notification = require('../models/notifications.model');



exports.createconge = async (req, res) => {
  try {
      const { type, date_Debut, date_Fin, motif } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!motif || !type) {
          return res.status(400).json({ error: "Conge type and motif are required." });
      }

      // Date validation and parsing
      const startDate = new Date(date_Debut);
      const endDate = new Date(date_Fin);
      const now = new Date();

      // Remove time components for date comparison
      const today = new Date(now.setHours(0, 0, 0, 0));
      const startDay = new Date(startDate.setHours(0, 0, 0, 0));
      const endDay = new Date(endDate.setHours(0, 0, 0, 0));

      // Validate date formats
      if (isNaN(startDate) || isNaN(endDate)) {
          return res.status(400).json({ error: "Invalid date format" });
      }

      // Date comparison validations
      if (startDay < today) {
          return res.status(400).json({ error: "Start date cannot be in the past" });
      }

      if (endDay <= startDay) {
          return res.status(400).json({ error: "End date must be after start date" });
      }

      // Calculate maximum allowed date (1 year from now)
      const maxAllowedDate = new Date(today);
      maxAllowedDate.setFullYear(maxAllowedDate.getFullYear() + 1);

      if (endDay > maxAllowedDate) {
          return res.status(400).json({ error: "End date cannot be more than 1 year in the future" });
      }

      // Calculate business days (weekdays only)
      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const timeDifference = endDate - startDate;
      const daysDifference = Math.ceil(timeDifference / millisecondsPerDay) + 1;

      // Find user and validate balance
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }
      if (!user.cin || !user.personalInfo.phone){
        return res.status(400).json({ error: "Informations  Personnel ou Social financiere incomplètes" });
      }
      if(user?.financialInfo?.contractType!='Stage'){
        if(!user.financialInfo.RIB){
          return res.status(400).json({ error: "Informations professionnelles ou financiere incomplètes" });
        }

      }
      if (!user.professionalInfo?.salary || !user.financialInfo?.CNSS ) {
        throw new Error('Informations professionnelles ou financiere incomplètes');
      }

      if (user.timeOffBalance < daysDifference) {
          return res.status(400).json({
              error: `Insufficient balance. Required: ${daysDifference} days, Available: ${user.timeOffBalance}`
          });
      }
      else{
        user.timeOffBalance -= daysDifference;
        await user.save();
      }


      if (user.timeOffBalance === 0) {
          return res.status(400).json({ error: "No remaining time off balance" });
      }
      //VERIFIER SI L'UTILISATEUR a deja une demande de conge en attente
      const existingPendingConge = await Conge.findOne({
          user: userId,
          status: 'En attente'
      });
      if (existingPendingConge) {
          return res.status(400).json({
              error: "You already have a pending conge request"
          });
      }
        //VERIFIER SI pris un conge Accepté cet mois
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed
        const currentYear = currentDate.getFullYear();
        const existingConge = await Conge.findOne({
            user: userId,
            status: 'Accepté',
            date_Debut: {
                $gte: new Date(currentYear, currentMonth - 1, 1),
                $lt: new Date(currentYear, currentMonth, 1)
            }
        })
        if (existingConge) {
            return res.status(400).json({
                error: "You already have a conge request accepted this month"
            });
        }
       

      // Check if user has already submitted a conge request

      // Create conge record
      const congeData = {
          user: userId,
          type,
          date_Debut: startDate,
          date_Fin: endDate,
          motif,
          firstName: user.firstName,
          lastName: user.lastName,
          status: 'En attente',
      };

      const newConge = new Conge(congeData);
      await newConge.save();

      // Notify HR team
      const rhsUsers = await User.find({ role: "rh" });
      if (rhsUsers.length > 0) {
          const rhsEmails = rhsUsers.map(rh => rh.email);
          await sendNotification(
              rhsEmails,
              user.firstName,
              user.lastName,
              userId,
              type,
              user.email
          );
      }

      res.status(201).json({
          message: "Demande de congé submitted successfully",
          data: newConge
      });
  } catch (error) {
      console.error("Conge creation error:", error);
      res.status(500).json({
          message: "Server error",
          error: error.message
      });
  }
};
exports.getCongeById = async (req, res) => {
      console.log("conge called")
      const idrconge=req.params.id;
      const conge = await Conge.findById(idrconge);
      if (!conge) {
          return res.status(404).json({ message: "Conge not found" });
      }
      res.status(200).json(conge);
    }

exports.updateConge = async (req, res) => {
    try {
        const congeId = req.params.id;
        const { type, date_Debut, date_Fin, motif } = req.body;
        const userId = req.user.id;

        // Find the existing conge
        const existingConge = await Conge.findById(congeId);
        if (!existingConge) {
            return res.status(404).json({ error: "Conge not found" });
        }

        // Check if the conge belongs to the user
        if (existingConge.user.toString() !== userId) {
            return res.status(403).json({ error: "Not authorized to update this conge" });
        }

        // Check if conge is already approved or rejected
        if (existingConge.status !== 'En attente') {
            return res.status(400).json({ error: "Cannot update conge that is not in pending status" });
        }

        // Validate required fields
        if (!motif || !type) {
            return res.status(400).json({ error: "Conge type and motif are required." });
        }

        // Date validation and parsing
        const startDate = new Date(date_Debut);
        const endDate = new Date(date_Fin);
        const now = new Date();

        // Remove time components for date comparison
        const today = new Date(now.setHours(0, 0, 0, 0));
        const startDay = new Date(startDate.setHours(0, 0, 0, 0));
        const endDay = new Date(endDate.setHours(0, 0, 0, 0));

        // Validate date formats
        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Date comparison validations
        if (startDay < today) {
            return res.status(400).json({ error: "Start date cannot be in the past" });
        }

        if (endDay <= startDay) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        // Calculate maximum allowed date (1 year from now)
        const maxAllowedDate = new Date(today);
        maxAllowedDate.setFullYear(maxAllowedDate.getFullYear() + 1);

        if (endDay > maxAllowedDate) {
            return res.status(400).json({ error: "End date cannot be more than 1 year in the future" });
        }

        // Calculate business days (weekdays only)
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const timeDifference = endDate.getTime() - startDate.getTime();
        const newDaysDifference = Math.ceil(timeDifference / millisecondsPerDay) + 1;
        
        // Convert existing dates to timestamps for calculation
        const existingStartDate = new Date(existingConge.date_Debut).getTime();
        const existingEndDate = new Date(existingConge.date_Fin).getTime();
        const oldTimeDifference = existingEndDate - existingStartDate;
        const oldDaysDifference = Math.ceil(oldTimeDifference / millisecondsPerDay) + 1;

        // Find user and validate balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Validate user information
        if (!user.cin || !user.personalInfo.phone) {
            return res.status(400).json({ error: "Informations Personnel ou Social nanciere incomplètes" });
        }

        if (user?.financialInfo?.contractType !== 'Stage') {
            if (!user.financialInfo.RIB) {
                return res.status(400).json({ error: "Informations professionnelles ou financiere incomplètes" });
            }
        }

        if (!user.professionalInfo?.salary || !user.financialInfo?.CNSS) {
            return res.status(400).json({ error: 'Informations professionnelles ou financiere incomplètes' });
        }

        // Adjust user's time off balance
        const balanceAdjustment = newDaysDifference - oldDaysDifference;
        if (user.timeOffBalance < balanceAdjustment) {
            return res.status(400).json({
                error: `Insufficient balance. Required: ${newDaysDifference} days, Available: ${user.timeOffBalance + oldDaysDifference}`
            });
        }

        // Update user's balance
        user.timeOffBalance -= balanceAdjustment;
        await user.save();

        // Update conge record
        const updatedConge = await Conge.findByIdAndUpdate(
            congeId,
            {
                type,
                date_Debut: startDate,
                date_Fin: endDate,
                motif,
                status: 'En attente' 
            },
            { new: true }
        );
        const rhsUsers = await User.find({ role: "rh" });
      if (rhsUsers.length > 0) {
          const rhsEmails = rhsUsers.map(rh => rh.email);
          await sendNotificationupdate(
              rhsEmails,
              user.firstName,
              user.lastName,
              userId,
              type,
              user.email
          );
      }
        
        res.status(200).json({
            message: "Conge updated successfully",
            data: updatedConge
        });
       // snet  
        
    } catch (error) {
        console.error("Conge update error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

    async function sendNotification(emails, firstName, lastName, id, type, email) { 
      try {
        console.log("emails",emails)
        const io = require('../server').io;
    
        console.log("io",io)
    
        const users = await User.find({ email: { $in: emails } });
        console.log("users",users)
        if (users.length === 0) {
          console.log('No users found for notification');
          return;
        }
        
        const message = `📥 Nouvelle  conge ${type} de ${firstName} ${lastName}
    🗓 ${new Date().toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })} ⏰ ${new Date().toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}
    📧 ${email}}`;
    
        const notifications = users.map(user => ({
          sender: id,
          recipient: user._id,
          message: message
        }));
    
        await Notification.insertMany(notifications);
    
        users.forEach(user => {
          const userRoom = `user_${user._id}`;
          console.log("userRoom", userRoom);
          io.to(userRoom).emit('notif', { 
            type: 'new_request',
            message: message,
            timestamp: new Date().toISOString()
          });
        });
    
        console.log(`Notifications sent to ${users.length} users for new ${type} approval`); // Fixed 'role' to 'type'
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }
    

    async function sendNotificationupdate(emails, firstName, lastName, id, type, email) { 
        try {
          console.log("emails",emails)
          const io = require('../server').io;
      
          console.log("io",io)
      
          const users = await User.find({ email: { $in: emails } });
          console.log("users",users)
          if (users.length === 0) {
            console.log('No users found for notification');
            return;
          }
          
          const message = `📥 un conge a éte modifier  ${type} de ${firstName} ${lastName}
      🗓 ${new Date().toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })} ⏰ ${new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}
      📧 ${email}}`;
      
          const notifications = users.map(user => ({
            sender: id,
            recipient: user._id,
            message: message
          }));
      
          await Notification.insertMany(notifications);
      
          users.forEach(user => {
            const userRoom = `user_${user._id}`;
            console.log("userRoom", userRoom);
            io.to(userRoom).emit('notif', { 
              type: 'new_request',
              message: message,
              timestamp: new Date().toISOString()
            });
          });
      
          console.log(`Notifications sent to ${users.length} users for new ${type} approval`); // Fixed 'role' to 'type'
        } catch (error) {
          console.error('Error sending notifications:', error);
        }
      }