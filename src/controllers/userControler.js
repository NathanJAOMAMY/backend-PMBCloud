const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Inscription d'un nouvel utilisateur
const inscriptions = async (req, res) => {
  try {
    const {
      surname,
      userName,
      email,
      roleUser,
      pseudo,
      responsibilities,
      password,
      idUser,
    } = req.body;
    // Vérifier si email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "L'adresse email que vous essayez d'utiliser existe déjà.",
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      idUser,
      surname,
      userName,
      email,
      roleUser,
      pseudo,
      responsibilities,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Supprimer le mot de passe avant de renvoyer la réponse
    const userSafe = savedUser.toObject();
    delete userSafe.password;

    res.status(200).json({
      message: "Votre compte a été bien enregistré.",
      data: userSafe,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};

// Récupérer tous les utilisateurs
const allUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Ne pas renvoyer les passwords
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};

// Connexion / login
const log = async (req, res) => {
  try {
    const { identifiant, password } = req.body;

    const user = await User.findOne({
      $or: [{ userName: identifiant }, { email: identifiant }],
    });

    if (!user) {
      return res.status(404).json({ message: "Compte non disponible." });
    }

    const correctPass = await bcrypt.compare(password, user.password);
    if (!correctPass) {
      return res
        .status(400)
        .json({ message: "Votre mot de passe n'est pas correct." });
    }

    // JWT
    const token = jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
        avatar: user.avatar,
      },
      "MY_PRIVATE_KEY",
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // cookie sécurisé en prod uniquement
      sameSite: "Strict",
      maxAge: 24 * 3600 * 1000, // 24 heures
    });

    const userSafe = user.toObject();
    delete userSafe.password;

    res.status(200).json({ user: userSafe, token });
  } catch (err) {
    res.status(500).json({
      message: "Erreur de récupération de l'utilisateur.",
      error: err,
    });
  }
};

// Récupérer un utilisateur par son id
const userByIds = async (req, res) => {
  try {
    const user = await User.findOne({ idUser: req.params.id });
    if (!user) {
      return res
        .status(404)
        .json({ message: "L'utilisateur que vous cherchez n'existe pas." });
    }
    res.status(200).json({ message: "Utilisateur récupéré", data: user });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};

// Mise à jour utilisateur sans modifier le mot de passe
const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    userName,
    surname,
    email,
    roleUser,
    statusUser,
    pseudo,
    avatar,
    responsibilities,
  } = req.body;
  try {
    const updatedUser = await User.updateOne(
      { idUser: id },
      {
        $set: {
          userName,
          surname,
          email,
          roleUser,
          statusUser,
          pseudo,
          avatar,
          responsibilities,
        },
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "L'utilisateur que vous cherchez à modifier n'existe pas.",
      });
    }
    res.status(200).json({ message: `Utilisateur modifié`, data: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};

// Mise à jour du mot de passe uniquement
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.params;

    const user = await User.findOne({ idUser: id });

    if (!user) {
      return res.status(404).json({ message: "L'utilisateur n'existe pas" });
    }

    const isOk = await bcrypt.compare(oldPassword, user.password);
    if (!isOk) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect" });
    }

    const hashNewPass = await bcrypt.hash(newPassword, 10);
    user.password = hashNewPass;
    await user.save();

    res.status(200).json({ message: "Mot de passe mis à jour" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};

// Suppression d'un utilisateur
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await User.deleteOne({ idUser: id });

    if (!deletedUser) {
      return res
        .status(404)
        .json({ message: "Utilisateur introuvable pour suppression." });
    }
    res.status(200).json({
      message: `${deletedUser || "L'utilisateur"} a bien été supprimé.`,
      data: deletedUser,
    });
  } catch (err) {
    console.error("Erreur lors de la suppression :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

module.exports = {
  inscriptions,
  allUsers,
  log,
  userByIds,
  updateWithoutPassword: updateUser,
  updateWithPassword: updatePassword,
  deleteUser,
};
