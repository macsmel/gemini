"use strict";
const FilesController = require("./controllers/filesController");
const filesController = new FilesController();
const Confirm = require("prompt-confirm");

const targetPath = process.env.TARGET_PATH;
const deletionPath = process.env.DELETION_PATH ?? targetPath;

if (!targetPath) throw new Error("Undefined path name!");

(async () => {
  new Confirm("Use Hash Mode?")
    .ask(async (answer) => {
      const length = await filesController.findDuplicates(targetPath, deletionPath, answer);
      console.log(`Found: ${length} duplicates.`);
      length > 0 && await filesController.deleteDuplicates();
    });
})();
