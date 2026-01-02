import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  Notice
} from 'obsidian';
import { minimatch } from 'minimatch';

interface MergePluginSettings {
  folderName: string;
  outputFolder: string;
  outputFileName: string;
  includeHidden: boolean;
  excludedFiles: string;
  recursive: boolean;
  MDMtitle: string;
  isOnlyBody: boolean;
  MDMlist: string[];
  showRibbonIcon: boolean;
}

const DEFAULT_SETTINGS: MergePluginSettings = {
  folderName: "",
  outputFolder: "merged",
  outputFileName: "merged-output-{date}.md",
  includeHidden: false,
  excludedFiles: "",
  recursive: false,
  MDMtitle: 'MDMtitle',
  isOnlyBody: false,
  MDMlist: [],
  showRibbonIcon: true,
  
};

export default class MergeMarkdownPlugin extends Plugin {
  settings!: MergePluginSettings;

  async onload() {
    await this.loadSettings();

    if (this.settings.showRibbonIcon) {
      this.addRibbonIcon('merge', 'Merge .md files', async () => {
        await this.mergeMarkdownFiles();
      });
    }

    this.addCommand({
      id: 'merge-md-files',
      name: 'Merge .md files',
      callback: async () => {
        await this.mergeMarkdownFiles();
      }
    });

    this.addSettingTab(new MergeSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async mergeMarkdownFiles() {
    let folder: TFolder;

    if (!this.settings.folderName.trim()) {
      folder = this.app.vault.getRoot();
    } else {
      const found = this.app.vault.getFolderByPath(this.settings.folderName);
      if (!found) {
        new Notice(`Folder "${this.settings.folderName}" not found or is not a folder.`);
        return;
      }
      folder = found;
    }

    const outputFolder = this.settings.outputFolder.trim();
    let outputFileName = this.settings.outputFileName.trim();

    const today = new Date().toISOString().split('T')[0];
    outputFileName = outputFileName.replace('{date}', today);

    if (!outputFileName.toLowerCase().endsWith('.md')) {
      outputFileName += '.md';
    }

    const folderPath = outputFolder.replace(/^\/+|\/+$/g, '');
    const outputPath = folderPath ? `${folderPath}/${outputFileName}` : outputFileName;

    try {
      await this.ensureFolderExists(folderPath);
    } catch (e) {
      console.error(e);
      new Notice(`Failed to create output folder: ${folderPath}`);
      return;
    }

    const excludedPatterns = this.settings.excludedFiles
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const files = this.collectMarkdownFiles(folder, outputPath, excludedPatterns);

    if (files.length === 0) {
      new Notice("No markdown files found to merge.");
      return;
    }

    let mergedContent = "";

    for (const file of files) {
      let header =""
      let content = ""
      let finalContent=""
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter || {};
      if (this.settings.MDMtitle){
        if (this.settings.MDMtitle in frontmatter && 
        typeof frontmatter[this.settings.MDMtitle] === 'string') {
      header = frontmatter[this.settings.MDMtitle] ?? "";
    }
        if (header){
          header = `${header}\n\n`;
        }
      } else {
        header = `# ${file.basename}\n\n`;
      }
      if(this.settings.MDMlist.length>0){
      
      const array1: string[] = this.settings?.MDMlist ?? [];
      const array2: string[] = frontmatter?.MDMlist ?? [];
      const set2 = new Set(array2);
      const hasMatch: boolean = array1.some(item => set2.has(item));
      if(hasMatch){
        content = await this.app.vault.read(file);
        if(this.settings.isOnlyBody){
       const endIndex = content.indexOf('\n---\n', content.indexOf('---\n') + 3);
       content = endIndex > -1 ? content.slice(endIndex + 5) : content;
      }
        
        finalContent = `${header}${content.trim()}\n\n`;
      }
      } else {
       content = await this.app.vault.read(file);
       if(this.settings.isOnlyBody){
       const endIndex = content.indexOf('\n---\n', content.indexOf('---\n') + 3);
       content = endIndex > -1 ? content.slice(endIndex + 5) : content;
      }
        
        finalContent = `${header}${content.trim()}\n\n`;
      }

      mergedContent += finalContent;
    }

    try {
      const existingFile = this.app.vault.getFileByPath(outputPath);
      if (existingFile && existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, mergedContent);
      } else {
        await this.app.vault.create(outputPath, mergedContent);
      }
      new Notice(`Merged ${files.length} files into ${outputPath}`);
    } catch (err) {
      console.error(err);
      new Notice("Failed to write merged file.");
    }
  }

  async ensureFolderExists(path: string) {
    if (!path) return;
    const parts = path.split('/');
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const exists = this.app.vault.getFolderByPath(currentPath);
      if (!exists) {
        await this.app.vault.createFolder(currentPath);
      }
    }
  }

  collectMarkdownFiles(folder: TFolder, outputPath: string, excludedPatterns: string[]): TFile[] {
    const files: TFile[] = [];
    const stack: TFolder[] = [folder];

    while (stack.length) {
      const current = stack.pop()!;
      for (const child of current.children) {
        if (child instanceof TFolder && this.settings.recursive) {
          stack.push(child);
        } else if (
          child instanceof TFile &&
          child.extension === 'md' &&
          child.path !== outputPath &&
          !excludedPatterns.some(pattern => minimatch(child.path, pattern)) &&
          (this.settings.includeHidden || !child.name.startsWith('.'))
        ) {
          files.push(child);
        }
      }
    }
    return files.sort((a, b) => a.name.localeCompare(b.name));
  }
}

class MergeSettingTab extends PluginSettingTab {
  plugin: MergeMarkdownPlugin;

  constructor(app: App, plugin: MergeMarkdownPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Source folder")
      .setDesc("Name of the folder in your vault to merge .md files from. Leave blank to merge from vault root.")
      .addText(text =>
        text
          .setPlaceholder("Folder to merge")
          .setValue(this.plugin.settings.folderName)
          .onChange(async (value) => {
            this.plugin.settings.folderName = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Output folder")
      .setDesc("Where to save the merged file. Leave blank for root. Defaults to 'merged'")
      .addText(text =>
        text
          .setPlaceholder("Export path")
          .setValue(this.plugin.settings.outputFolder)
          .onChange(async (value) => {
            this.plugin.settings.outputFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Output file name")
      .setDesc("Supports {date}. Defaults to 'merged-output-{date}.md'")
      .addText(text =>
        text
          .setPlaceholder("File name")
          .setValue(this.plugin.settings.outputFileName)
          .onChange(async (value) => {
            this.plugin.settings.outputFileName = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Include hidden files")
      .setDesc("Include files that start with a dot (e.g. .hidden.md)")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.includeHidden)
          .onChange(async (value) => {
            this.plugin.settings.includeHidden = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Recursive mode")
      .setDesc("Also merge markdown files from subfolders within the source folder.")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.recursive)
          .onChange(async (value) => {
            this.plugin.settings.recursive = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Excluded files (glob patterns)")
      .setDesc("Comma-separated glob patterns to exclude (e.g. README.md, secret/*.md, notes/**/*.md)")
      .addTextArea(text =>
        text
          .setPlaceholder("README.md, secret/*.md")
          .setValue(this.plugin.settings.excludedFiles)
          .onChange(async (value) => {
            this.plugin.settings.excludedFiles = value;
            await this.plugin.saveSettings();
          })
      );

  new Setting(containerEl)
  .setName('Custom Title Property seperator')
  .setDesc('Frontmatter property name for custom title seperator (e.g., MDMtitle). Make sure the property is of type string!')
  .addText(text => text
    .setPlaceholder('MDMtitle')
    .setValue(this.plugin.settings.MDMtitle)
    .onChange(async (value) => {
      this.plugin.settings.MDMtitle = value;
      await this.plugin.saveSettings();
    })
  );


      new Setting(containerEl)
      .setName("Remove frontmatter before merge")
      .setDesc("Will remove the front matter block before merging the content")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.isOnlyBody)
          .onChange(async (value) => {
            this.plugin.settings.isOnlyBody = value;
            await this.plugin.saveSettings();
          })
      ); 


      new Setting(containerEl)
      .setName("Use list to keep")
      .setDesc('Comma-separated list. Will keep only files for merge which hold the listed list items in property "MDMlist".')
      .addTextArea(text =>
        text
          .setPlaceholder("npc, secret, date")
          .setValue(this.plugin.settings.MDMlist.join(','))
          .onChange(async (value) => {
            let tagList = value.split(',').map(item => item.trim());
            if (tagList[0]==="") { tagList = []}
            this.plugin.settings.MDMlist = tagList;
            await this.plugin.saveSettings();
          })
      );
      

    new Setting(containerEl)
      .setName("Show ribbon button")
      .setDesc("Toggle to show or hide the ribbon button. This setting will reload Obsidian if changed.")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.showRibbonIcon)
          .onChange(async (value) => {
            this.plugin.settings.showRibbonIcon = value;
            await this.plugin.saveSettings();
            window.location.reload();
          })
      );
  
    }
}