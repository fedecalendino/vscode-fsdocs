/* eslint-disable no-prototype-builtins */
import * as vscode from 'vscode';
import * as path from 'path';
import { readdirSync, readFileSync } from "fs";

import { Entry } from "./tree_data_providers/entry";
import { MainTreeDataProvider } from './tree_data_providers/main_tree_data_provider';
import { EXCLUDE } from './config';

const EXTENSION_NAME = "file-structure-docs";
const CONFIG_FILE = "fsdocs.config.json";



export class FSDocsFileExplorer {

	private config: JSON;
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

	private registerWatchers(workspaceRoot: string, context: vscode.ExtensionContext) {
		const pattern = path.join(workspaceRoot, '*');

		const fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
		fileWatcher.onDidChange(() => this.refreshTree(context));
	}

	private registerCommands(context: vscode.ExtensionContext) {
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

	private readConfiguration(): any {
		if(vscode.workspace.workspaceFolders === undefined) {
			return JSON.parse("{}");
		}
		
		const working_directory = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const config_path = path.join(working_directory, CONFIG_FILE);
		
		try {
			return JSON.parse(readFileSync(config_path).toString());
		} catch (error) {
			if (error.code == "ENOENT")
				console.error(`${EXTENSION_NAME}: missing config file '${CONFIG_FILE}'.`);
			else if (error.name == "SyntaxError")
				vscode.window.showErrorMessage(`${EXTENSION_NAME}: config file is not a valid JSON file.`);
			
			return undefined;
		}
	}

	private async openFile(resource: any) {
		vscode.window.showTextDocument(resource);
	}

	private async openConfigFile() {
		const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const config_file_path = path.join(workspaceRoot, CONFIG_FILE);
		const config_file_uri = vscode.Uri.file(config_file_path);

		try {
			await vscode.workspace.fs.stat(config_file_uri);
			
			vscode.workspace.openTextDocument(config_file_uri);
			vscode.window.showTextDocument(config_file_uri);
		} catch {
			vscode.window.showInformationMessage(`${config_file_uri.toString()} file doesn't exist`);
			const template: string = readFileSync("assets/fsdocs.template.json").toString();

			const newFile = vscode.Uri.parse('untitled:' + config_file_path);
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
		const name: string = resource.uri.toString().split("/").at(-1);
		
		if (!this.config["items"].hasOwnProperty(name)) {
			vscode.window.showErrorMessage(`Item '${name}' has no label`);
			return;
		}

		if (!this.config["items"][name].hasOwnProperty("label")) {
			vscode.window.showErrorMessage(`Item '${name}' has no label`);
			return;
		}

		const label: string = this.config["items"][name]["label"];
		this._updateClipboard(label);
	}
	
	private async copyElementName(resource: any) {
		const name: string = resource.uri.toString().split("/").at(-1);
		this._updateClipboard(name);
	}

	private async copyElementPath(resource: any) {
		const path: string = resource.uri.toString();
		this._updateClipboard(path);
	}

	private async revealElement(resource: any) {
		vscode.commands.executeCommand('revealInExplorer', resource.uri);
	}

	private refreshTree(context: vscode.ExtensionContext): void {
		this.config = this.readConfiguration();

		const treeDataProvider = new MainTreeDataProvider(this.config);
		this.treeView = vscode.window.createTreeView(
			'fsdocs-file-explorer', 
			{ treeDataProvider }
		);

		context.subscriptions.push(this.treeView);
	}

	private searchElement(context: vscode.ExtensionContext) {
		const options: vscode.InputBoxOptions = {
			prompt: "Search in fsdocs labels and file/folder names",
			placeHolder: "text to search"
		};
		
		vscode.window.showInputBox(options).then(value => {
			if (!value) {
				return;
			}
			
			vscode.window.withProgress(
				{ 
					location: vscode.ProgressLocation.Window, 
					title: `Searching for ${value}` }, 
					async () => {
						this.revealFilesAndFolders(value.toLowerCase());
						this.refreshTree(context);
					}
				);
		});
	}

	private revealFilesAndFolders(searchText: string) {
		const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
		
		this._revealFilesAndFolders(
			workspaceRoot.toString(), 
			searchText
		);
	}

	private _revealFilesAndFolders(root: string, searchText: string) {
		const name: string = root.split("/").at(-1);

		if (EXCLUDE.includes(root)) {
			return undefined;
		}

		readdirSync(root, {withFileTypes: true }).forEach(
			(dirent) => {
				const path = `${root}/${dirent.name}`;

				if (this._shouldReveal(dirent.name, searchText)) {
					this.treeView.reveal(
						{
							uri: vscode.Uri.file(path),
							type: dirent.isDirectory()? 2 : 1,
						}
					);
				}

				if (dirent.isDirectory()) { 
					this._revealFilesAndFolders(path, searchText);
				}
			}
		);
	}

	private _shouldReveal(name: string, searchText: string): boolean {
		if (name.includes(searchText)) {
			return true;
		}

		if (!this.config["items"].hasOwnProperty(name)) {
			return false;
		}

		const item = this.config["items"][name];

		if (item.hasOwnProperty("label")) {
			const label = item["label"].toLowerCase();
				
			if (label.includes(searchText)) {
				return true;
			}
		}

		// if (item.hasOwnProperty("description")) {
		// 	const description = item["description"].toLowerCase();
				
		// 	if (description.includes(searchText)) {
		// 		return true;
		// 	}
		// }
		
		return false;
	}
}