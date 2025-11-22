const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const User = require("../models/users");

const initDb = async () => {
  try {
    const existing = await User.findOne({ userName: "Admin" });

    if (!existing) {
      // Utilisateur initiale
      const defaultUsers = [
        {
          userName: "Admin",
          surname: "Admin",
          roleUser: ["admin"],
          password: "admin",
          email: "admin@promabio.com",
        },
        {
          userName: "Eric",
          surname: "Rajaobelinirina",
          roleUser: ["admin"],
          password: "0000",
          email: "rajaobelinirina@promabio.com",
        },
        {
          userName: "Benoit",
          surname: "Grosjean",
          password: "0000",
          roleUser: ["admin"],
          email: "benoit.grosjean06@gmail.com",
        },
        {
          userName: "DevOps",
          surname: "PROMABIO",
          password: "0000",
          roleUser: ["admin"],
          email: "anizwamilibra@gmail.com",
        },
        {
          userName: "Njeva",
          surname: "Randriamanantenasoa",
          password: "0000",
          roleUser: ["admin"],
          email: "njevalandyrandriamanantenasoa@gmail.com",
        },
        {
          userName: "Romain",
          surname: "Albert",
          password: "0000",
          roleUser: ["admin"],
          email: "romainalbert@hotmail.fr",
        },
        {
          userName: "Sabrina",
          surname: "Ranjanoro",
          password: "0000",
          roleUser: ["admin"],
          email: "sabrina.2154@gmail.com",
        },
                {
          userName: "Ando",
          surname: "Andrianavalonoro",
          password: "0000",
          roleUser: ["comptability"],
          email: "compta@promabio.com",
        },
        {
          userName: "Production",
          surname: "Promabio",
          password: "0000",
          roleUser: ["Production"],
          email: "production@promabio.com",
        },
        {
          userName: "Quality",
          surname: "PROMABIO",
          password: "0000",
          roleUser: ["Quality"],
          email: "qualite@promabio.com",
        },
        {
          userName: "Resp",
          surname: "Amélioration Continue",
          password: "0000",
          roleUser: ["improvement"],
          email: "amelioration@promabio.com",
        },
        {
          userName: "Thierry",
          surname: "Zandona",
          password: "0000",
          roleUser: ["Logistics"],
          email: "logistique@promabio.com",
        },
        {
          userName: "Assistante",
          surname: "Admin PROMABIO",
          password: "0000",
          roleUser: ["Human Resources"],
          email: "assistanteadmin@promabio.com",
        },
        {
          userName: "Assistante",
          surname: "Fairtrade Romela",
          password: "0000",
          roleUser: ["Certification"],
          email: "fairtradeassistante@promabio.com",
        },
        {
          userName: "Certification",
          surname: "Promabio",
          password: "0000",
          roleUser: ["Certification"],
          email: "certification@promabio.com",
        },
        {
          userName: "Claude",
          surname: "Hubo AH-THIVE",
          password: "0000",
          roleUser: ["Other"],
          email: "claude@promabio.com",
        },
        {
          userName: "Cq",
          surname: "Roslin",
          password: "0000",
          roleUser: ["Quality"],
          email: "cqdongaroslin@gmail.com",
        },
        {
          userName: "Cq",
          surname: "Promabio Angelita",
          password: "0000",
          roleUser: ["Quality"],
          email: "controleurqualite2@promabio.com",
        },
        {
          userName: "Dahel",
          surname: "PROMABIO",
          password: "0000",
          roleUser: ["Production"],
          email: "dahel@promabio.com",
        },
        {
          userName: "Data",
          surname: "Production",
          password: "0000",
          roleUser: ["Production"],
          email: "data@promabio.com",
        },
        {
          userName: "Devops",
          surname: "Promabio",
          password: "0000",
          roleUser: ["Other"],
          email: "nadrasanamichael@gmail.com",
        },
        {
          userName: "Gestionnaire",
          surname: "de Donnée PMB Stephan",
          password: "0000",
          roleUser: ["Management"],
          email: "stephan.promabio@gmail.com",
        },
        {
          userName: "Infirmierie",
          surname: "PROMABIO",
          password: "0000",
          roleUser: ["nurse"],
          email: "infirmierie@promabio.com",
        },
        {
          userName: "Lova",
          surname: "PROMABIO",
          password: "0000",
          roleUser: ["Management"],
          email: "lova@promabio.com",
        },
        {
          userName: "Maintenance",
          surname: "Promabio",
          password: "0000",
          roleUser: ["Maintenance"],
          email: "maintenance@promabio.com",
        },
      ];

      // On hash tous les mots de passe en parallèle
      const usersWithHashedPasswords = await Promise.all(
        defaultUsers.map(async (user) => ({
          idUser: uuid(),
          userName: user.userName,
          surname: user.surname,
          roleUser: user.roleUser,
          email: user.email,
          password: await bcrypt.hash(user.password, 10),
        }))
      );

      // Insert tous les utilisateurs d’un coup
      await User.insertMany(usersWithHashedPasswords);

      // console.log("Utilisateurs par défaut créés avec succès !");
    } else {
      // console.log("Les utilisateurs par défaut existent déjà.");
    }

    // console.log("Base de données initialisée !");
  } catch (err) {
    console.error("Erreur lors de l'initialisation de la base :", err);
  }
};

module.exports = initDb;
