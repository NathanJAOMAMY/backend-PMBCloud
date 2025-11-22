const FileModel = require("../models/files");
const FolderModel = require("../models/folder");
const { v4: uuid } = require("uuid");

// Créer un fichier
const createFile = async (req, res) => {
  const {
    originalName,
    fileName,
    sizeFile,
    typeFile,
    mimeType,
    url,
    folderId,
    userId,
    userIdAcces,
  } = req.body;
  try {
    const newFile = await FileModel.create({
      id: uuid(),
      fileName,
      originalName,
      sizeFile,
      typeFile,
      mimeType,
      url,
      folderId: folderId || null,
      userId,
      userIdAcces: userIdAcces || [],
    });

    res
      .status(201)
      .json({ message: "Fichier créé avec succès", data: newFile });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la création du fichier" });
  }
};

const getFiles = async (req, res) => {
  const { folderId, userId, departmentRoutes } = req.query;

  try {
    let query = {};

    if (departmentRoutes) {
      // Mode département
      if (folderId === departmentRoutes) {
        query = {
          $or: [
            { departementAcces: { $in: [departmentRoutes] } },
            { folderId: folderId},
          ],
        };
      } else {
        query = {
          $or: [
            { folderId: folderId },
          ],
        };
      }
    } else if (userId) {
      // Mode utilisateur
      query = {
        $or: [{ userId }, { userIdAcces: { $in: [userId] } }],
      };
      if (folderId) query.folderId = folderId;
      else query.folderId = null;
    }

    const files = await FileModel.find(query);
    res.status(200).json({
      message: "Fichiers récupérés avec succès",
      allFiles: files,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des fichiers",
    });
  }
};

// Récupérer un fichier par ID
const getFileById = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await FileModel.findOne({ id });

    res
      .status(200)
      .json({ message: "Fichier récupéré avec succès", data: file });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du fichier" });
  }
};

// Mettre à jour le nom d’un fichier
const updateFile = async (req, res) => {
  const { id, newFileName } = req.body;

  if (!newFileName)
    return res.status(400).json({ error: "Le nouveau nom est requis" });

  try {
    const updated = await FileModel.findOneAndUpdate(
      { id },
      { fileName: newFileName },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Nom du fichier mis à jour", data: updated });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du fichier" });
  }
};

// Supprimer un fichier
const deleteFile = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await FileModel.findOne({ id });
    if (!file) return res.status(404).json({ message: "Fichier introuvable" });

    await FileModel.deleteOne({ id });
    res.status(200).json({ message: "Fichier supprimé avec succès" });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la suppression du fichier" });
  }
};

// Créer un dossier avec plusieurs fichiers
const createMultipleFiles = async (req, res) => {
  const { folderName, files, userId, userIdAcces } = req.body;

  if (!folderName || !files?.length)
    return res.status(400).json({ error: "Dossier et fichiers requis" });

  try {
    // Création du dossier
    const folder = await FolderModel.create({
      id: uuid(),
      name: folderName,
      userId,
      userIdAcces: userIdAcces || [],
    });

    // Création des fichiers
    const filesToCreate = files.map((file) => ({
      id: uuid(),
      fileName: file.fileName,
      originalName: file.originalName,
      sizeFile: file.sizeFile,
      typeFile: file.typeFile,
      mimeType: file.mimeType,
      url: file.url,
      folderId: folder.id_folder,
      userId,
      userIdAcces: userIdAcces || [],
    }));

    await FileModel.insertMany(filesToCreate);

    res.status(201).json({
      message: "Dossier et fichiers créés avec succès",
      folder,
      files: filesToCreate,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la création des fichiers" });
  }
};

// Partager un fichier avec une liste d’utilisateurs
const shareFile = async (req, res) => {
  const { id } = req.params;
  const { userIdAcces } = req.body; // tableau d'IDs d’utilisateurs
  if (!userIdAcces || !Array.isArray(userIdAcces)) {
    return res.status(400).json({ error: "userIdAcces doit être un tableau" });
  }

  try {
    const updated = await FileModel.findOneAndUpdate(
      { id },
      { $addToSet: { userIdAcces: { $each: userIdAcces } } }, // évite doublons
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Fichier introuvable" });
    }

    res.status(200).json({
      message: "Fichier partagé avec succès",
      data: updated,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors du partage du fichier" });
  }
};

const shareFileWithDepartement = async (req, res) => {
  const { id } = req.params;
  const { departementAcces } = req.body; // tableau d'IDs de départements
  if (!departementAcces || !Array.isArray(departementAcces)) {
    return res
      .status(400)
      .json({ error: "departementAcces doit être un tableau" });
  }
  try {
    const updated = await FileModel.findOneAndUpdate(
      { id },
      { $addToSet: { departementAcces: { $each: departementAcces } } }, // évite doublons
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Fichier introuvable" });
    }
    res.status(200).json({
      message: "Fichier partagé avec le département avec succès",
      data: updated,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors du partage du fichier" });
  }
};

// Récupérer les fichiers que j’ai partagés (moi = propriétaire)
const getSharedFiles = async (req, res) => {
  const { userId } = req.query;

  try {
    const files = await FileModel.find({
      userId,
      userIdAcces: { $exists: true, $ne: [] }, // au moins un accès
    });

    res.status(200).json({
      message: "Fichiers partagés récupérés",
      files,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
};

// Récupérer les fichiers partagés avec moi
const getFilesSharedWithMe = async (req, res) => {
  const { userId, departement } = req.query;

  try {
    const files = await FileModel.find({
      $or: [
        { userIdAcces: { $in: [userId] } },
        { departementAcces: { $in: [departement] } },
      ],
    });

    res.status(200).json({
      message: "Fichiers partagés avec moi récupérés",
      files,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
};

module.exports = {
  createFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  createMultipleFiles,
  shareFile,
  getSharedFiles,
  getFilesSharedWithMe,
  shareFileWithDepartement,
};
