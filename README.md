## Gemini

Find duplicate files and wipe them away with Gemini. It's a command-line tool that will assist you in establishing a custom method for finding and deleting duplicate files.

## Getting Started

First, install Node.js:

```bash
TARGET_PATH='TARGET_PATH' DELETION_PATH='OPTIONAL_DELETION_PATH' npm start
# or
TARGET_PATH='TARGET_PATH' DELETION_PATH='OPTIONAL_DELETION_PATH' yarn start
# or
TARGET_PATH='TARGET_PATH' DELETION_PATH='OPTIONAL_DELETION_PATH' pnpm start
```
## Parameters

TARGET_PATH = The path where you need to find duplicates.
OPTIONAL_DELETION_PATH = If you have more than one folder with the same duplicates, and you want to delete duplicates only in one of the folders, you have to use that parameter.
