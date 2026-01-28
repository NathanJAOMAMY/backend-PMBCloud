const express = require("express");
const mime = require("mime");
const router = express.Router();
const fs = require("fs");

const {
  getFiles,
  createFile,
  deleteFile,
  getFileById,
  createMultipleFiles,
  shareFile,
  getSharedFiles,
  getFilesSharedWithMe,
  updateFile,
  shareFileWithDepartement,
} = require("../controllers/fileController");

router.post("/", createFile);
router.post("/many", createMultipleFiles);
router.post("/share/:id", shareFile);
router.post("/share-departement/:id", shareFileWithDepartement);


router.get("/", getFiles);
router.get("/shared", getSharedFiles);
router.get("/shared-with-me", getFilesSharedWithMe);
router.get("/read/:foldername/:filename", (req, res) => {
  
  if (fs.existsSync(filePath)) {
    const mimeType = mime.getType(filePath);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", "inline");
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).send("Fichier non trouvé.");
  }
});
router.get("/:id", getFileById);
router.delete("/:id", deleteFile);

router.put("/update", updateFile);
module.exports = router;
