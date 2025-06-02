const mongoose = require('mongoose');
const User = require('./models/User.model');
const Conge = require('./models/conge.model');
const Document = require('./models/document.model');
const Formation = require('./models/formation.model');
const Avance = require('./models/avance.model');
const Message = require('./models/messagesModel');
const Notification = require('./models/notifications.model');
const bcrypt = require('bcryptjs');

// Configuration de la connexion MongoDB
mongoose.connect('mongodb://localhost:27017/PortalRh', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Fonction pour générer des dates aléatoires
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Fonction principale de seed
async function seedDatabase() {
  try {
    // Suppression des données existantes
    await Promise.all([
      User.deleteMany({}),
      Conge.deleteMany({}),
      Document.deleteMany({}),
      Formation.deleteMany({}),
      Avance.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // Création des utilisateurs
    const users = [];
    const password = await bcrypt.hash('123!', 10);

    // Créer un admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@example.com',
      password,
      role: 'admin',
      isVerified: true,
      isApproved: true
    });
    users.push(admin);

    // Créer un RH
    const rh = await User.create({
      firstName: 'RH',
      lastName: 'Manager',
      email: 'rh@example.com',
      password,
      role: 'rh',
      isVerified: true,
      isApproved: true
    });
    users.push(rh);

    // Créer 18 collaborateurs
    for (let i = 1; i <= 18; i++) {
      const user = await User.create({
        firstName: `User${i}`,
        lastName: `Test${i}`,
        email: `user${i}@example.com`,
        password,
        role: 'collaborateur',
        isVerified: true,
        isApproved: true,
        personalInfo: {
          phone: `+216${Math.floor(10000000 + Math.random() * 90000000)}`,
          address: `Address ${i}`,
          birthDate: getRandomDate(new Date(1980, 0, 1), new Date(2000, 0, 1))
        },
        financialInfo: {
          RIB: `RIB${i}`,
          taxId: `TAX${i}`,
          CNSS: `CNSS${i}`,
          paymentMethod: 'virement',
          contractType: i % 3 === 0 ? 'CDD' : 'CDI',
          transportAllowance: 100 + (i * 10)
        },
        professionalInfo: {
          position: `Position ${i}`,
          department: `Department ${i % 4}`,
          hiringDate: getRandomDate(new Date(2020, 0, 1), new Date()),
          salary: 2000 + (i * 100)
        },
        socialInfo: {
          maritalStatus: i % 2 === 0 ? 'married' : 'single',
          children: i % 3
        }
      });
      users.push(user);
    }

    // Créer des congés
    for (const user of users) {
      if (user.role === 'collaborateur') {
        await Conge.create({
          user: user._id,
          type: 'annuel',
          date_Debut: getRandomDate(new Date(2023, 0, 1), new Date()),
          date_Fin: getRandomDate(new Date(), new Date(2024, 0, 1)),
          motif: 'Congé annuel',
          status: 'pending',
          firstName: user.firstName,
          lastName: user.lastName
        });
        
      }
    }

    console.log('Base de données peuplée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du peuplement de la base de données:', error);
    process.exit(1);
  }
}

seedDatabase();