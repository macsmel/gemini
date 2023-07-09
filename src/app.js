"use strict";
const FilesController = require("./controllers/filesController");
const filesController = new FilesController();

(async () => {
  const length = await filesController.findDuplicates("FOLDER_PATH",
    "SUB_FOLDER_DELETION_PATH_OR_REPEAT_FOLDER_PATH");
  console.log(`Found: ${length} duplicates.`);
  length > 0 && await filesController.deleteDuplicates();
})();
