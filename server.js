const express = require("express");
const path = require("path");
const fileRoutes = require("./routes/fileRoutes");
const fs = require("fs");
const app = express();
const port = 3000;

// Function to log messages to a file
function logToFile(message) {
  const logFilePath = path.join(__dirname, "logs", "logthisissue.log");
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error("Error writing to log file", err);
    }
  });
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/", fileRoutes);

// 404 handler: This should come after all routes and static file serving
app.use((req, res, next) => {
  logToFile(`404 error encountered: ${req.url}`); // Log 404 errors
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

// Start the server
app.listen(port, () => {
  const message = `Server running at http://localhost:${port}`;
  console.log(message);
  logToFile(message); // Log when the server starts
});
