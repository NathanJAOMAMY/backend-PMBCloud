const express = require("express");
const router = express.Router();
const { inscriptions, allUsers, log, userByIds, updateWithoutPassword, updateWithPassword, deleteUser } = require("../controllers/userControler");

// CREATE : Inscription
router.post("/addUser", inscriptions);
// READ : Tous les utilisateurs
router.get("/allUser", allUsers);
// LOGIN
router.post("/login", log);
// READ : Un utilisateur par ID
router.get("/:id", userByIds);
// UPDATE : sans mot de passe
router.put("/:id",updateWithoutPassword);
// UPDATE : mot de passe
router.put("/pass/:id", updateWithPassword);
// DELETE
router.delete("/:id", deleteUser);

module.exports = router;
