const fs = require("fs").promises;
const { unlink } = fs;
const path = require("path");
const Confirm = require('prompt-confirm');

module.exports = class FilesController {
  #duplicates = [];
  #filenames = {};
  #skipped = [];
  findDuplicates = async (dir, deletionDir) => {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.startsWith(".")) continue;
      const filePath = path.join(dir, file);
      const filename = path.parse(file).base;
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await this.findDuplicates(filePath, deletionDir);
      } else {
        const savedFile = this.#filenames[filename];
        if (savedFile) {
          if (savedFile.size === stats.size) {
            this.#duplicates.push(filePath.includes(deletionDir) ? filePath : savedFile.path);
          } else {
            this.#skipped.push({a: filePath, b: savedFile.path, sizes: [savedFile.size, stats.size]});
          }
        } else {
          this.#filenames[filename] = {...stats, path: filePath};
        }
      }
    }
    this.#duplicates = this.#duplicates.filter(path => path.includes(deletionDir));
    return this.#duplicates.length;
  };
  deleteDuplicates = async () => {
    new Confirm("Do you want to delete all duplicates?")
      .ask(async (answer) => {
        try {
          if (answer) {
            await Promise.all(this.#duplicates.map(path => unlink(path)));
            console.log("Done.");
          } else {
            await fs.writeFile("duplicates.json", JSON.stringify(this.#duplicates,null,2));
            await fs.writeFile("skipped.json", JSON.stringify(this.#skipped,null,2));
            console.log("File duplicates.json and skipped.json were created.");
          }
        } catch (err) {
          console.log(err);
        }
      });
  };
}
