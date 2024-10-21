const express = require("express");
const path = require("path");
const fs = require("fs");
const { convertToBookmarks } = require("../src/convertToBookmarks");
const router = express.Router();
const multer = require("multer");

// Updated multer configuration to store uploaded files with the .json extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".json"; // Ensure .json extension
    cb(null, file.fieldname + "-" + uniqueSuffix + ext); // Preserve extension or use .json
  },
});

const upload = multer({ storage: storage });
let selfDestructTimers = {};

router.post("/convert", upload.single("jsonFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const jsonFileName = req.file.filename; // Store the actual JSON filename
  const jsonFilePath = path.join(__dirname, "../uploads", jsonFileName); // Full path to JSON file
  const outputDir = path.join(__dirname, "../uploads");

  logToFile(`Uploaded JSON file path: ${jsonFilePath}`);

  try {
    const outputFileName = convertToBookmarks(jsonFilePath, outputDir);
    const downloadPath = `/download/${outputFileName}`;

    logToFile(`Generated HTML file: ${outputFileName}`);

    // Send the response with the download path and delete timer
    res.status(200).json({
      message: "File converted successfully.",
      downloadPath: downloadPath,
      deletePath: `/delete/${outputFileName}`,
      jsonFileName: jsonFileName, // Pass the actual JSON filename to the front-end
      timer: 60, // 1 minute in seconds for testing
    });

    // Set a self-destruct timer to delete both files after 60 seconds
    selfDestructTimers[outputFileName] = setTimeout(() => {
      const htmlFilePath = path.join(__dirname, "../uploads", outputFileName);

      logToFile(`Self-destruct timer triggered for files`);

      // Delete JSON file
      if (fs.existsSync(jsonFilePath)) {
        logToFile(`Found JSON file for deletion: ${jsonFilePath}`);
        fs.unlink(jsonFilePath, (err) => {
          if (err) {
            console.error(`Error deleting JSON file: ${jsonFilePath}`, err);
            logToFile(`Error deleting JSON file: ${jsonFilePath} - ${err}`);
          } else {
            logToFile(`JSON file ${jsonFilePath} deleted successfully.`);
          }
        });
      }

      // Delete HTML file
      if (fs.existsSync(htmlFilePath)) {
        logToFile(`Found HTML file for deletion: ${htmlFilePath}`);
        fs.unlink(htmlFilePath, (err) => {
          if (err) {
            console.error(`Error deleting HTML file: ${htmlFilePath}`, err);
            logToFile(`Error deleting HTML file: ${htmlFilePath} - ${err}`);
          } else {
            logToFile(`HTML file ${htmlFilePath} deleted successfully.`);
          }
        });
      }

      // Clean up the timer
      delete selfDestructTimers[outputFileName];
    }, 60000); // 60 seconds for testing
  } catch (error) {
    logToFile(`Error during file conversion: ${error}`);
    res.status(500).json({ message: "File conversion failed." });
  }
});



router.get("/download/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "../uploads", fileName);

  logToFile(`Download request received for file: ${fileName}`);

  res.download(filePath, fileName, (err) => {
    if (err) {
      logToFile(`Error downloading file: ${fileName} - ${err}`);
      res.status(500).send("Error downloading file.");
    } else {
      logToFile(`File downloaded successfully: ${fileName}`);
    }
  });
});
router.post("/delete/:fileName", (req, res) => {
  const fileName = req.params.fileName; // HTML filename
  const htmlFilePath = path.join(__dirname, "../uploads", fileName);

  // Get the JSON file name from the request body
  const jsonFileName = req.body.jsonFileName;
  const jsonFilePath = path.join(__dirname, "../uploads", jsonFileName);

  logToFile(`Delete request received for file: ${fileName}`);

  // Try to delete the HTML file
  fs.unlink(htmlFilePath, (err) => {
    if (err) {
      logToFile(`Error deleting HTML file: ${fileName} - ${err}`);
      return res.status(500).json({ message: "Error deleting HTML file" });
    }

    logToFile(`HTML file ${fileName} deleted successfully.`);

    // Now try to delete the corresponding JSON file
    fs.unlink(jsonFilePath, (err) => {
      if (err) {
        logToFile(`Error deleting JSON file: ${jsonFileName} - ${err}`);
        return res.status(500).json({ message: "Error deleting JSON file" });
      }

      logToFile(`JSON file ${jsonFileName} deleted successfully.`);
      res.json({ message: `Both HTML and JSON files deleted successfully.` });
    });
  });
});



// Function to log messages to a file
function logToFile(message) {
  const logFilePath = path.join(__dirname, "../logs/logthisissue.log"); // Make sure the 'logs' directory exists
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error("Error writing to log file", err);
    }
  });
}

module.exports = router;
