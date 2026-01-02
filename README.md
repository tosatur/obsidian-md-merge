# .md Merge

.md Merge is an Obsidian plugin that allows you to merge multiple Markdown files from a folder (and optionally its subfolders) into a single consolidated file.

## Features

* Merge all `.md` files from a specified folder
* Optional recursive mode to include subfolders
* Customize the output file name using templates like `{date}`
* Exclude specific files or patterns using glob syntax (e.g., `README.md`, `drafts/*.md`)
* Optionally include or exclude hidden files
* Create output folders automatically if they don't exist
* Access functionality via:

  * Sidebar ribbon button
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
* **Output folder**: Where the merged file is saved; defaults to `/merged`
* **Output file name**: Template name, supports `{date}`
* **Include hidden files**: Include files that begin with a `.`
* **Recursive mode**: Include files from subfolders.
* **Excluded files**: Glob patterns to ignore (comma-separated).
* **Custom Title Property**: Expects a string which ist the name of the property which holds the separator title for example "MDMtitle". The property must be a string type property.
* **Remove frontmatter before merge**: Removes frontmatter information before note is merged
* **Use list to keep**: Will expect a frontmatter property "MDMlist" of type list item. If one of the items in this setting is found in the list of the property then the note will be exported and merged.
* **Show ribbon Button**: Will show a ribbon button for export in the left sidebar if set to true. (Was originally removed - probably because if became an official plugin)

## Commands

* **Merge Markdown Files**: Available in the command palette. Can also be triggered via hotkey.

## Notes

* Output file is overwritten on each merge.
* Input files must have the `.md` extension.
* Output folder and file are created if they don't exist.

## License

GNU General Public License v3.0
