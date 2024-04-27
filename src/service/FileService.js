"use strict";

const fs = require("fs").promises;
const { createReadStream } = require("fs");
const { unlink } = fs;
const path = require("path");
const Confirm = require("prompt-confirm");
const crypto = require("crypto");

module.exports = class FileService {
  #duplicates = [];
  #fileNames = {};
  #fileHashes = {};
  #skipped = [];
  #deletionDir = "";
  #saveDuplicates = (filePath, savedFile) => {
    const includeDeletionDir = filePath.includes(this.#deletionDir);
    this.#duplicates.push({
      deletionPath: includeDeletionDir ? filePath : savedFile.path,
      originPath: !includeDeletionDir ? filePath : savedFile.path,
    });
  };
  #skipDuplicate = (info, reason) => {
    this.#skipped.push({...info, reason});
  };
  #simpleComparison = ({stats, filePath, fileName}) => {
    const savedFile = this.#fileNames[fileName];
    if (!savedFile) {
      this.#fileNames[fileName] = {...stats, path: filePath};
      return;
    }
    if (savedFile.size === stats.size) {
      this.#saveDuplicates(filePath, savedFile);
    } else {
      this.#skipDuplicate({a: { path: filePath, size: stats.size }, b: { path: savedFile.path, size: stats.size }},
        "Different Size");
      this.#skipped.push({a: filePath, b: savedFile.path, sizes: [savedFile.size, stats.size]});
    }
  };
  #readFileAndGetHash = (filePath) => {
    return new Promise((res, rej) => {
      const readStream = createReadStream(filePath, { encoding: "base64" });
      const hash = crypto.createHash("sha256");
      readStream.on("error", (error) => rej(error.message));
      readStream.on("data", (chunk) => hash.update(chunk));
      readStream.on("end", () => res(hash.digest("hex")));
    });
  };
  #hashComparison = async ({filePath, stats}) => {
    console.log(filePath, stats.size);
    // if (stats.size > 6e+9) return this.#skipDuplicate({path: filePath, size: stats.size},
    //   "Size limit");
    const fileHash = await this.#readFileAndGetHash(filePath);
    console.log(fileHash);
    const savedFile = this.#fileHashes[fileHash];
    if (savedFile) {
      this.#saveDuplicates(filePath, savedFile, fileHash);
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
      const fileName = path.parse(file).base;
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await this.findDuplicates(filePath, deletionDir, hashMode);
      } else {
        const info = { filePath, stats, fileName };
        hashMode ? await this.#hashComparison(info) : this.#simpleComparison(info);
      }
    }
    this.#duplicates = this.#duplicates.filter(duplicate => duplicate.deletionPath.includes(deletionDir));
    return this.#duplicates.length;
  };
  deleteDuplicates = async () => {
    new Confirm("Do you want to delete all duplicates?")
      .ask(async (answer) => {
        if (!answer) {
          await this.#outputList("duplicates.json", this.#duplicates);
          await this.#outputList("skipped.json", this.#skipped);
          console.log("File duplicates.json and skipped.json were created.");
          return;
        }
        for (const duplicate of this.#duplicates) {
          try {
            await fs.access(duplicate.deletionPath);
            await unlink(duplicate.deletionPath);
            console.log(`Deleted file: ${duplicate.deletionPath}`);
          } catch (err) {
            console.log(`File not found: ${duplicate.deletionPath}`);
          }
        }
        console.log("Done.");
      });
  };
};
