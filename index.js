#!/usr/bin/env node

const importData = require("./importer");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the path to the XLSX file: ", (filePath) => {
  importData(filePath)
    .then(() => {
      console.log("Import completed.");
      rl.close();
    })
    .catch((error) => {
      console.error("Error during import:", error);
      rl.close();
    });
});
