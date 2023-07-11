"use strict";
const FilesController = require("./controllers/filesController");
const filesController = new FilesController();
const Confirm = require('prompt-confirm');

(async () => {
  new Confirm("Use Hash Mode?")
    .ask(async (answer) => {
      const length = await filesController.findDuplicates("FOLDER_PATH",
        "SUB_FOLDER_DELETION_PATH_OR_REPEAT_FOLDER_PATH", answer);
      console.log(`Found: ${length} duplicates.`);
      length > 0 && await filesController.deleteDuplicates();
    });
})();
