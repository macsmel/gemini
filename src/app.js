"use strict";
const FilesController = require("./controllers/filesController");
const filesController = new FilesController();
const Confirm = require("prompt-confirm");

(async () => {
  new Confirm("Use Hash Mode?")
    .ask(async (answer) => {
      const length = await filesController.findDuplicates("SEARCH_FOLDER",
        "DELETION_FOLDER_OR_SEARCH_FOLDER", answer);
      console.log(`Found: ${length} duplicates.`);
      length > 0 && await filesController.deleteDuplicates();
    });
})();
