# .md Merge

.md Merge is an Obsidian plugin that allows you to merge multiple Markdown files from a folder (and optionally its subfolders) into a single consolidated file.

## Features

* Merge all `.md` files from a specified folder
* Optional recursive mode to include subfolders
* Customize the output file name using templates like `{date}`
* Exclude specific files or patterns using glob syntax (e.g., `README.md`, `drafts/*.md`)
* Optionally include or exclude hidden files
* Create output folders automatically if they don't exist
* Toggle the ribbon icon on or off
* Access functionality via:

  * Sidebar ribbon button (optional)
  * Command palette
  * Hotkey

## Installation

1. Download or clone this repository.

2. Place the plugin folder inside `.obsidian/plugins/` of your vault.

3. Run `npm install` to install dependencies.

4. Build the plugin with:

   ```bash
   npm run build
   ```

5. Enable the plugin from Obsidian’s **Settings → Community Plugins**.

## Settings

* **Source folder**: Path relative to vault root; leave blank to merge from root.
* **Output folder**: Where the merged file is saved; defaults to `/merged`.
* **Output file name**: Template name, supports `{date}`.
* **Include hidden files**: Include files that begin with a `.`.
* **Recursive mode**: Include files from subfolders.
* **Excluded files**: Glob patterns to ignore (comma-separated).
* **Show sidebar button**: Show/hide the ribbon icon.

## Commands

* **Merge Markdown Files**: Available in the command palette. Can also be triggered via hotkey.

## Notes

* Output file is overwritten on each merge.
* Input files must have the `.md` extension.
* Output folder and file are created if they don't exist.

## License

GNU General Public License v3.0