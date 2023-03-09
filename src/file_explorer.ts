/* eslint-disable no-prototype-builtins */
import { readdirSync, readFileSync } from "fs";
import * as path from 'path';
import * as vscode from 'vscode';

import { Config } from "./config";
import { MainTreeDataProvider } from './tree_data_provider';
import { Entry } from "./tree_data_providers/entry";
import * as utils from './utils';


export class FSDocsFileExplorer {

	private config: Config;
	private searchText?: string;
	private treeView: vscode.TreeView<Entry>;

	constructor(context: vscode.ExtensionContext) {
		if (vscode.workspace.workspaceFolders === undefined)
			return;
		else if (vscode.workspace.workspaceFolders.length == 0)
			return; 
		
		const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
		
		this.registerCommands(context);
		this.registerWatchers(workspaceRoot, context);

		this.refreshTree(context);
	}

	private async registerWatchers(workspaceRoot: string, context: vscode.ExtensionContext) {
		const pattern = path.join(workspaceRoot, '*');

		const fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
		fileWatcher.onDidChange(() => this.refreshTree(context));
	}

	private async registerCommands(context: vscode.ExtensionContext) {
		vscode.commands.registerCommand(
			'fsdocs-file-explorer.open-file', 
			(resource) => this.openFile(resource)
		);

		vscode.commands.registerCommand(
			'fsdocs-file-explorer.open-config-file', 
			(resource) => this.openConfigFile()
		);

		vscode.commands.registerCommand(
			'fsdocs-file-explorer.copy-element-label', 
			(resource) => this.copyElementLabel(resource)
		);

		vscode.commands.registerCommand(
			'fsdocs-file-explorer.copy-element-name', 
			(resource) => this.copyElementName(resource)
		);

		vscode.commands.registerCommand(
			'fsdocs-file-explorer.copy-element-path', 
			(resource) => this.copyElementPath(resource)
		);

		vscode.commands.registerCommand(
			'fsdocs-file-explorer.reveal-element', 
			(resource) => this.revealElement(resource)
		);

		vscode.commands.registerCommand(
			'fsdocs-file-explorer.refresh-tree', 
			(resource) => this.refreshTree(context)
		);

		vscode.commands.registerCommand(
			'fsdocs-file-explorer.search-element', 
			(resource) => this.searchElement(context)
		);
	}

	private async openFile(resource: any) {
		vscode.window.showTextDocument(resource);
	}

	private async openConfigFile() {
		const config_file_uri = Config.uri();

		try {
			await vscode.workspace.fs.stat(config_file_uri);
			
			vscode.workspace.openTextDocument(config_file_uri);
			vscode.window.showTextDocument(config_file_uri);
		} catch {
			vscode.window.showInformationMessage(`${config_file_uri.toString()} file doesn't exist, creating a new one...`);

			const template: string = readFileSync("assets/fsdocs.template.json").toString();
			const newFile = vscode.Uri.parse('untitled:' + config_file_uri.path);

			vscode.workspace.openTextDocument(newFile).then(document => {
				const edit = new vscode.WorkspaceEdit();
				edit.insert(newFile, new vscode.Position(0, 0), template);

				return vscode.workspace.applyEdit(edit);
			});
		}
	}

	private async _updateClipboard(text: string) {
		vscode.env.clipboard.writeText(text);
		vscode.window.showInformationMessage(`Copied '${text}' to clipboard`);
	}

	private async copyElementLabel(resource: any) {
		const name = utils.getFilename(resource.uri);
		const item = this.config.getItem(name);
		
		if (item === undefined || item.label === undefined) {
			vscode.window.showErrorMessage(`Item '${name}' has no label`);
			return;
		}
		
		this._updateClipboard(item.label);
	}
	
	private async copyElementName(resource: any) {
		const name = utils.getFilename(resource.uri).split(path.sep).at(-1);
		this._updateClipboard(name);
	}

	private async copyElementPath(resource: any) {
		const path = resource.uri.toString();
		this._updateClipboard(path);
	}

	private async revealElement(resource: any) {
		vscode.commands.executeCommand('revealInExplorer', resource.uri);
	}

	private async refreshTree(context: vscode.ExtensionContext) {
		this.config = new Config();

		const treeDataProvider = new MainTreeDataProvider(this.config, this.searchText);
		
		this.treeView = vscode.window.createTreeView(
			'fsdocs-file-explorer', 
			{ 
				treeDataProvider: treeDataProvider,
				showCollapseAll: true 
			}
		);

		context.subscriptions.push(this.treeView);
	}

	private async searchElement(context: vscode.ExtensionContext) {
		const options: vscode.InputBoxOptions = {
			prompt: "Search in fsdocs labels and descriptions [beta]",
			placeHolder: "(found items will be highlighted with a 🔍)"
		};
		
		vscode.window.showInputBox(options).then(value => {
			if (value) {
				this.searchText = value.toLowerCase();
				vscode.commands.executeCommand('workbench.actions.treeView.fsdocs-file-explorer.collapseAll');
				this.revealFilesAndFolders(this.searchText);
			} else {
				this.searchText = undefined;
			}

			this.refreshTree(context);
		});
	}

	private async revealFilesAndFolders(searchText: string) {
		const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
		
		this._revealFilesAndFolders(
			workspaceRoot.toString(), 
			searchText
		);
	}

	private _revealFilesAndFolders(root: string, searchText: string) {
		readdirSync(root, {withFileTypes: true}).forEach(
			(dirent) => {
				if (this.config.ignored().includes(dirent.name))
					return;

				const path = `${root}/${dirent.name}`;

				if (this._shouldReveal(dirent.name, searchText))
					this.treeView.reveal({
						uri: vscode.Uri.file(path),
						type: dirent.isDirectory()? 2 : 1,
					});

				if (dirent.isDirectory())
					this._revealFilesAndFolders(path, searchText);
			}
		);
	}

	private _shouldReveal(name: string, searchText: string): boolean {
		const item = this.config.getItem(name);
		return item && item.containsSearchText(searchText);
	}
}