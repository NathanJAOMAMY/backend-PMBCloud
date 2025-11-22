const folderModel = require("../models/folder");
const fileModel = require("../models/files");
const archiver = require("archiver");
const { supabase } = require("../middlewares/supabase");

// Créer un nouveau dossier
const createFolder = async (req, res) => {
  const { id, name, parentFolderId, userId, userIdAcces = [] } = req.body;
  let parentFolder = parentFolderId ?? null;

  if (!id || !name || !userId) {
    return res
      .status(400)
      .json({ message: "id, name et userId sont obligatoires" });
  }

  try {
    const newFolder = await folderModel.create({
      id,
      name,
      parentFolderId: parentFolder,
      userId,
      userIdAcces,
    });

    res
      .status(201)
      .json({ message: "Dossier créé avec succès", data: newFolder });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la création du dossier" });
  }
};

const updateFolder = async (req, res) => {
  const { id, newFolderName } = req.body;
  if (!newFolderName)
    return res.status(400).json({ error: "Le nouveau nom est requis" });

  try {
    const updated = await folderModel.findOneAndUpdate(
      { id },
      { name: newFolderName },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Nom du dossier mis à jour", data: updated });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du dossier" });
  }
};
const getFolders = async (req, res) => {
  const { parentFolderId, userId, departmentRoutes } = req.query;

  try {
    let query = {};

    if (departmentRoutes) {
      // Mode département
      if (parentFolderId === departmentRoutes) {
        query = {
          $or: [
            { departementAcces: { $in: [departmentRoutes] } },
            { parentFolderId: parentFolderId || null },
          ],
        };
      } else {
        query = {
          $or: [
            { parentFolderId: parentFolderId || null },
          ],
        };
      }
    } else if (userId) {
      // Mode utilisateur
      query = {
        $or: [{ userId }, { userIdAcces: { $in: [userId] } }],
      };
      if (parentFolderId) query.parentFolderId = parentFolderId;
      else query.parentFolderId = null; // Racine
    }

    const folders = await folderModel.find(query);
    res.status(200).json({
      message: "Dossiers récupérés avec succès",
      data: folders,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des dossiers",
    });
  }
};

// Récupérer un dossier par son id
const getFolderById = async (req, res) => {
  const { id } = req.params;

  try {
    const folder = await folderModel.findOne({ id });

    if (!folder) {
      return res.status(404).json({ message: "Dossier introuvable" });
    }

    res
      .status(200)
      .json({ message: "Dossier récupéré avec succès", data: folder });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du dossier" });
  }
};

// Fonction utilitaire pour récupérer récursivement tous les sous-dossiers
const getAllSubFolderIds = async (parentId) => {
  const subs = await folderModel.find({ parentFolderId: parentId });
  let ids = subs.map((f) => f.id);

  for (const sub of subs) {
    const subIds = await getAllSubFolderIds(sub.id);
    ids = ids.concat(subIds);
  }

  return ids;
};

// Récupérer l'arborescence complète d'un dossier (récursif)
const getFolderTree = async (req, res) => {
  const { id } = req.params;
  try {
    // Fonction récursive pour construire l'arbre
    const buildTree = async (folderId) => {
      const folder = await folderModel.findOne({ id: folderId });
      if (!folder) return null;

      // Récupère les fichiers du dossier
      const files = await fileModel.find({ folderId });

      // Récupère les sous-dossiers
      const subfolders = await folderModel.find({ parentFolderId: folderId });

      // Pour chaque sous-dossier, construit son arbre
      const children = [];
      for (const sub of subfolders) {
        const childTree = await buildTree(sub.id);
        if (childTree) children.push(childTree);
      }

      return {
        id: folder.id,
        name: folder.name,
        files,
        folders: children,
      };
    };

    const tree = await buildTree(id);
    if (!tree) return res.status(404).json({ message: "Dossier introuvable" });

    res.status(200).json({ message: "Arborescence récupérée", data: tree });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'arborescence" });
  }
};

const shareFolder = async (req, res) => {
  const { id } = req.params;
  const { userIdAcces } = req.body;
  if (!userIdAcces || !Array.isArray(userIdAcces) || userIdAcces.length === 0) {
    return res
      .status(400)
      .json({ message: "userIdAcces doit être un tableau non vide" });
  }
  try {
    // Vérifier le dossier racine
    const folder = await folderModel.findOne({ id });
    if (!folder) {
      return res.status(404).json({ message: "Dossier introuvable" });
    }

    // Récupérer tous les sous-dossiers
    const subFolderIds = await getAllSubFolderIds(folder.id);
    const allFolderIds = [folder.id, ...subFolderIds];

    // Mettre à jour userIdAcces pour tous les dossiers concernés
    await folderModel.updateMany(
      { id: { $in: allFolderIds } },
      { $addToSet: { userIdAcces: { $each: userIdAcces } } }
    );

    // Mettre à jour tous les fichiers dans le dossier et ses sous-dossiers
    await fileModel.updateMany(
      { folderId: { $in: allFolderIds } },
      { $addToSet: { userIdAcces: { $each: userIdAcces } } }
    );

    res.status(200).json({ message: "Dossier partagé avec succès" });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors du partage du dossier" });
  }
};

// Partager un dossier avec un ou plusieurs départements
const shareFolderWithDepartement = async (req, res) => {
  const { id } = req.params;
  const { departementAcces } = req.body; // tableau de noms ou d'IDs de département
  if (
    !departementAcces ||
    !Array.isArray(departementAcces) ||
    departementAcces.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "departementAcces doit être un tableau non vide" });
  }
  try {
    // Met à jour le dossier racine
    const folder = await folderModel.findOneAndUpdate(
      { id },
      { $addToSet: { departementAcces: { $each: departementAcces } } },
      { new: true }
    );
    if (!folder) return res.status(404).json({ error: "Dossier introuvable" });

    // Met à jour tous les sous-dossiers et fichiers
    const subFolderIds = await getAllSubFolderIds(folder.id);
    const allFolderIds = [folder.id, ...subFolderIds];

    await folderModel.updateMany(
      { id: { $in: allFolderIds } },
      { $addToSet: { departementAcces: { $each: departementAcces } } }
    );
    await fileModel.updateMany(
      { folderId: { $in: allFolderIds } },
      { $addToSet: { departementAcces: { $each: departementAcces } } }
    );

    res.status(200).json({ message: "Dossier partagé avec département(s)" });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors du partage par département" });
  }
};

// Dossiers partagés par moi
const getSharedFolders = async (req, res) => {
  const { userId } = req.query;
  try {
    const folders = await folderModel.find({
      userId,
      userIdAcces: { $exists: true, $ne: [] },
      $or: [
        { parentFolderId: null },
        { parentFolderId: "" },
        { parentFolderId: "/" },
        { parentFolderId: { $exists: false } },
      ],
    });

    res.status(200).json({
      message: "Dossiers racine partagés récupérés",
      folders,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des dossiers partagés" });
  }
};

// Dossiers partagés avec moi
const getFoldersSharedWithMe = async (req, res) => {
  const { userId, departement } = req.query; // récupérer aussi le département
  try {
    const folders = await folderModel.find({
      $and: [
        {
          $or: [
            { userIdAcces: { $in: [userId] } },
            { departementAcces: { $in: [departement] } },
          ],
        },
        {
          $or: [
            { parentFolderId: null },
            { parentFolderId: "" },
            { parentFolderId: "/" },
            { parentFolderId: { $exists: false } },
          ],
        },
      ],
    });

    res.status(200).json({
      message: "Dossiers racine partagés avec moi récupérés",
      folders,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des dossiers partagés avec moi",
    });
  }
};

// Supprimer un dossier
const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    // Fonction récursive de suppression
    const deleteFolderRecursive = async (folderId) => {
      // 1. Supprimer les fichiers dans ce dossier
      const files = await fileModel.find({ folderId });
      for (const file of files) {
        // Supprimer le fichier dans Supabase Storage
        const pathInBucket = file.url.split("/intranet/")[1];
        await supabase.storage.from("intranet").remove([pathInBucket]);

        // Supprimer le fichier dans Mongo
        await fileModel.deleteOne({ id: file.id });
      }

      // 2. Récupérer les sous-dossiers
      const subfolders = await folderModel.find({ parentFolderId: folderId });
      for (const subfolder of subfolders) {
        await deleteFolderRecursive(subfolder.id);
      }

      // 3. Supprimer le dossier lui-même
      await folderModel.deleteOne({ id: folderId });
    };

    // Vérifier que le dossier existe
    const rootFolder = await folderModel.findOne({ id });
    if (!rootFolder) {
      return res.status(404).json({ error: "Dossier introuvable" });
    }

    // Appeler la suppression récursive
    await deleteFolderRecursive(id);

    res.json({ message: "Dossier et contenu supprimés avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression du dossier" });
  }
};

const downloadFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    // Récupérer le dossier racine
    const rootFolder = await folderModel.findOne({ id: folderId });
    if (!rootFolder) return res.status(404).send("Dossier introuvable");

    const zipFileName = `${rootFolder.name}.zip`;

    // Headers pour le téléchargement
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFileName}"`
    );

    const archive = require("archiver")("zip", { zlib: { level: 9 } });
    archive.pipe(res); // stream directement vers le client

    // Fonction récursive pour ajouter fichiers et sous-dossiers
    const addFolderContent = async (folder, currentPath) => {
      // Fichiers uniquement dans ce dossier
      const files = await fileModel.find({ folderId: folder.id });
      for (const file of files) {
        const pathInBucket = file.url.split("/intranet/")[1];
        const { data, error } = await supabase.storage
          .from("intranet")
          .download(pathInBucket);
        if (error) throw error;

        const buffer = Buffer.from(await data.arrayBuffer());
        archive.append(buffer, { name: `${currentPath}/${file.originalName}` });
      }

      // Sous-dossiers
      const subfolders = await folderModel.find({ parentFolderId: folder.id });
      for (const subfolder of subfolders) {
        await addFolderContent(subfolder, `${currentPath}/${subfolder.name}`);
      }
    };

    // Commence à partir du dossier racine
    await addFolderContent(rootFolder, rootFolder.name);

    // Finaliser le ZIP
    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la création du ZIP");
  }
};

module.exports = {
  createFolder,
  getFolders,
  getFolderById,
  deleteFolder,
  shareFolder,
  getSharedFolders,
  getFoldersSharedWithMe,
  updateFolder,
  downloadFolder,
  getFolderTree,
  shareFolderWithDepartement,
};
