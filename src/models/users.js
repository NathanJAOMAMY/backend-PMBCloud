const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    idUser: {
      type: String,
      required: true,
      unique: true,
    },
    userName: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    pseudo: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: true,
    },
    statusUser: {
      type: Boolean,
      default: false, // Utilisateur actif par défaut
    },
    roleUser: {
      type: [String],
      required: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

const Users = mongoose.model("User", userSchema);

module.exports = Users;
