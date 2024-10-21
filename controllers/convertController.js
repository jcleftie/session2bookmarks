const path = require("path");
const fs = require("fs");

// Function to convert JSON data into bookmarks and save as an HTML file
const convertToBookmarks = (inputFilePath, outputDir) => {
  const outputFileName = `bookmarks_${Date.now()}.html`; // Use a unique name with timestamp
  const outputFilePath = path.join(outputDir, outputFileName);

  try {
    const jsonData = fs.readFileSync(inputFilePath, "utf-8");
    const parsedData = JSON.parse(jsonData);

    let bookmarkHtmlContent = "<html><body><ul>";

    parsedData.windows.forEach((window) => {
      window.tabs.forEach((tab) => {
        bookmarkHtmlContent += `<li><a href="${tab.url}" target="_blank">${tab.title}</a></li>`;
      });
    });

    bookmarkHtmlContent += "</ul></body></html>";

    fs.writeFileSync(outputFilePath, bookmarkHtmlContent, "utf-8");

    console.log(`Bookmarks HTML file created at ${outputFilePath}`);

    // Return the output file name instead of sending the response here
    return outputFileName;
  } catch (error) {
    console.error("Error during file conversion:", error);
    throw error; // Throw the error so it can be handled in the route handler
  }
};

module.exports = { convertToBookmarks };
