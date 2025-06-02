const Document = require("../models/document.model");
const Formation = require("../models/formation.model");
const Conge = require("../models/conge.model");
const Notification = require("../models/notifications.model");
const Avance = require("../models/avance.model");
const User = require("../models/User.model");
const { generateFichePaiMensuel,generateFichePaiAnnuel,generateAttestationTravail,generateAttestationStage  } = require("../utils/pdfGenerator");





exports.getAllRequests = async (req, res) => {
  try {
    const demandes = await Document.find();
    const formations= await Formation.find();
    const conges= await Conge.find();
    const avances= await Avance.find();

    res.status(200).json(
        { demandes, formations, conges, avances }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const demandes = await Document.find({ user: userId });
    const formations= await Formation.find({ user: userId });
    const conges= await Conge.find({ user: userId });
    const avances= await Avance.find({ user: userId });

    res.status(200).json(
        { demandes, formations, conges, avances }
    );  
  }
  catch(error) {
    res.status(500).json({ error: error.message });
  }
  
  
}

exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status,endpoint } = req.body;
    const idRh = req.user.id;
    if (!id || !idRh) {
      return res.status(400).json({ error: "ID and ID_RH are required" });
    }


    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    console.log("req.body",req.body)
    console.log("endpoint",endpoint)
    if (!endpoint || (endpoint !== 'Document' && endpoint !== 'Formation' && endpoint !== 'Conge' && endpoint !== 'Avance')) {
      return res.status(400).json({ error: "This not demande type  valide" });
    }
    const rh= await User.findById(idRh);
    if (!rh) {
      return res.status(404).json({ error: "Rh not found" });
    }
    if (rh.role !== 'rh') {
      return res.status(403).json({ error: "Only RH can update requests" });
    }

    let docData;
    let request;
    switch (endpoint) {
      case 'Document':
        request = await Document.findById(id);
        break;
      case 'Formation':
        request = await Formation.findById(id);
        break;
      case 'Conge':
        request = await Conge.findById(id);
        break;
      case 'Avance':
        request = await Avance.findById(id);
        break;
      default:
        return res.status(400).json({ error: "Invalid endpoint" });
    }
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    const userId = request.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Check if the request is already approved
    if (request.status === 'Approuvé') {
      return res.status(400).json({ error: "Request already approved" });
    }

    if (status === 'Approuvé' && endpoint === 'Document') {
        switch(request.type) {
            case 'fiche_paie':
                if (request.periode === "mensuel") {
                    docData = await generateFichePaiMensuel(user, request,rh);
                } else if (request.periode === "annuel") {
                    docData = await generateFichePaiAnnuel(user, request, request.annee,rh);
                } else {
                    throw new Error(`Période non supportée: ${request.periode}`);
                }
                break;
            case 'attestation_de_stage':
                docData = await generateAttestationStage(user, request,rh);
                break;
                        
            case 'attestation':
                docData = await generateAttestationTravail(user, request,rh);
                break;
    
            default:
                throw new Error(`Type de document non supporté: ${request.type}`);
        }
    }
    
    // Update the request status
    request.status = status;
    await request.save();
    // Send notification to the user
    await sendNotification(
      user.email,
      user.firstName,
      user.lastName,
      userId, 
      request.type,
      user.email,
      endpoint
    );
    res.status(200).json({ message: "Request updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }    
};



exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { endpoint } = req.params;

    if (!endpoint || (endpoint !== 'Document' && endpoint !== 'Formation' && endpoint !== 'Conge' && endpoint !== 'Avance')) {
      return res.status(400).json({ error: "This not demande type  valide" });
    }
    
    let Model;
    switch (endpoint) {
      case 'Document':
        Model = Document;
        break;
      case 'Formation':
        Model = Formation;
        break;
      case 'Conge':
        Model = Conge;
        break;
      case 'Avance':
        Model = Avance;
        break;
      default:
        return res.status(400).json({ error: "Invalid endpoint" });
    }
    
    const result = await Model.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(200).json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}









async function sendNotification(emails, firstName, lastName, id, type, email,endpoint) { // Added 'io' as parameter
  try {
    console.log("emails",emails)
    const io = require('../server').io;
    console.log("id",id)
    console.log("io",io)

    const users = await User.find({ email: { $in: emails } });
    console.log("users",users)
    if (users.length === 0) {
      console.log('No users found for notification');
      return;
    }
    
    const message = `📥 Nouvelle demande ${endpoint} ${type} de ${firstName} ${lastName}
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
