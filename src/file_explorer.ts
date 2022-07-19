/* eslint-disable no-prototype-builtins */
import * as vscode from 'vscode';
import * as path from 'path';
import { readdirSync, readFileSync } from "fs";

import { Entry } from "./tree_data_providers/entry";
import { MainTreeDataProvider } from './tree_data_providers/main_tree_data_provider';


const EXTENSION_NAME = "file-structure-docs";
const CONFIG_FILE = "fsdocs.config.json";



export class FSDocsFileExplorer {

	private config: JSON;
	private treeView: vscode.TreeView<Entry>;

	constructor(context: vscode.ExtensionContext) {
		if (vscode.workspace.workspaceFolders === undefined) {
			return;
		} else if (vscode.workspace.workspaceFolders.length == 0) {
			return;
		} 
		
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
			if (error.code == "ENOENT") {
				console.error(`${EXTENSION_NAME}: missing config file '${CONFIG_FILE}'.`);
			} else if (error.name == "SyntaxError") {
				vscode.window.showErrorMessage(`${EXTENSION_NAME}: config file is not a valid JSON file.`);
			}

			return undefined;
		}
	}

	private openFile(resource: any): void {
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

	private copyElementLabel(resource: any): void {
		const name: string = resource.uri.toString().split("/").at(-1);
		
		// eslint-disable-next-line no-prototype-builtins
		if (this.config["items"].hasOwnProperty(name)) {
			const label: string = this.config["items"][name]["label"];

			vscode.env.clipboard.writeText(label);
			vscode.window.showInformationMessage(`Copied '${label}' to clipboard`);
		} else {
			vscode.window.showErrorMessage(`Item '${name}' has no label`);
		}
	}
	
	private copyElementName(resource: any): void {
		const name: string = resource.uri.toString().split("/").at(-1);

		vscode.env.clipboard.writeText(name);
		vscode.window.showInformationMessage(`Copied '${name}' to clipboard`);
	}

	private revealElement(resource: any): void {
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
			prompt: "Search in fsdocs labels and descriptions",
			placeHolder: "text to search"
		};
		
		vscode.window.showInputBox(options).then(value => {
			if (!value) {
				return;
			}
			
			this.revealFilesAndFolders(value.toLowerCase());
			this.refreshTree(context);
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

		if (item.hasOwnProperty("description")) {
			const description = item["description"].toLowerCase();
				
			if (description.includes(searchText)) {
				return true;
			}
		}
		
		return false;
	}
}