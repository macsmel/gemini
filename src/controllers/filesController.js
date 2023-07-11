const fs = require("fs").promises;
const { readFileSync} = require("fs");
const { unlink } = fs;
const path = require("path");
const Confirm = require('prompt-confirm');
const crypto = require("crypto");

module.exports = class FilesController {
  #duplicates = [];
  #filenames = {};
  #fileHashes = {};
  #skipped = [];
  #deletionDir = "";
  #saveDuplicates = (filePath, savedFile) => {
    this.#duplicates.push(filePath.includes(this.#deletionDir) ? filePath : savedFile.path);
  };
  #simpleComparison = ({stats, filePath, filename}) => {
    const savedFile = this.#filenames[filename];
    if (savedFile) {
      if (savedFile.size === stats.size) {
        this.#saveDuplicates(filePath, savedFile);
      } else {
        this.#skipped.push({a: filePath, b: savedFile.path, sizes: [savedFile.size, stats.size]});
      }
    } else {
      this.#filenames[filename] = {...stats, path: filePath};
    }
  };
  #hashComparison = ({filePath, stats}) => {
    const fileData = readFileSync(filePath);
    const fileHash = crypto.createHash("md5").update(fileData).digest("hex");
    const savedFile = this.#fileHashes[fileHash];
    if (savedFile) {
      this.#saveDuplicates(filePath, savedFile);
    } else {
      this.#fileHashes[fileHash] = {...stats, path: filePath};
    }
  };
  #outputList = async (name, list) => {
    await fs.writeFile(name, JSON.stringify(list,null,2));
  };
  findDuplicates = async (dir, deletionDir, hashMode) => {
    const files = await fs.readdir(dir);
    this.#deletionDir = deletionDir;
    for (const file of files) {
      if (file.startsWith(".")) continue;
      const filePath = path.join(dir, file);
      const filename = path.parse(file).base;
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await this.findDuplicates(filePath, deletionDir, hashMode);
      } else {
        const info = { filePath, stats, filename };
        hashMode ? this.#hashComparison(info) : this.#simpleComparison(info);
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
            await this.#outputList("duplicates.json", this.#duplicates);
            await this.#outputList("skipped.json", this.#skipped);
            console.log("File duplicates.json and skipped.json were created.");
          }
        } catch (err) {
          console.log(err);
        }
      });
  };
}
