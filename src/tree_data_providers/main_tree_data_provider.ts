/* eslint-disable no-prototype-builtins */
import * as vscode from 'vscode';

import { BaseFileSystemProvider as BaseTreeDataProvider } from "./base_tree_data_provider";
import { Entry } from "./entry";
import { EXCLUDE } from "../config";


export class MainTreeDataProvider extends BaseTreeDataProvider {
	
	protected config: JSON;

	constructor(config: JSON)
	{
		super();
		this.config = config;
	}

	getTreeItem(element: Entry): vscode.TreeItem {		
		const name: string = element.uri.toString().split("/").at(-1);

		if (EXCLUDE.includes(name)) {
			return undefined;
		}

		const treeItem = new vscode.TreeItem(
			element.uri, 
			element.type === vscode.FileType.Directory ? 
				vscode.TreeItemCollapsibleState.Collapsed : 
				vscode.TreeItemCollapsibleState.None
		);
		
		if (element.type === vscode.FileType.File) {
			treeItem.command = { 
				command: 'fsdocs-file-explorer.open-file', 
				title: "Open File", 
				arguments: [element.uri], 
			};

			treeItem.contextValue = 'file';
		}

		if (this.config === undefined) {
			return treeItem;
		}

		// eslint-disable-next-line no-prototype-builtins
		if (this.config["items"].hasOwnProperty(name)) {
			const item = this.config["items"][name];
			
			treeItem.description = this.makeTreeItemDescription(item);
			treeItem.tooltip = this.makeTreeItemTooltip(item);
		}

		return treeItem;
	}

	makeTreeItemDescription(item: any): string {
		let str = "";

		if (item.hasOwnProperty("environment")) {
			const environment = item["environment"];
			const environment_icon = this.config["environments"][environment];

			str += `${environment_icon} `;
		}

		if (item.hasOwnProperty("type")) {
			const type = item["type"];
			const type_icon = this.config["types"][type];

			str += `${type_icon} `;
		}

		str += item["label"];

		return str;
	}

	makeTreeItemTooltip(item: any): vscode.MarkdownString {
		const md = new vscode.MarkdownString();

		md.appendMarkdown(`**${item["label"]}**`);

		if (item.hasOwnProperty("environment")) {
			const environment = item["environment"];
			const environment_icon = this.config["environments"][environment];

			md.appendMarkdown(` [${environment_icon} · ${environment}]`);
		}
		
		if (item.hasOwnProperty("type")) {
			const type = item["type"];
			const type_icon = this.config["types"][type];

			md.appendMarkdown(` [${type_icon} · ${type}]`);
		}

		if (item.hasOwnProperty("description")) {
			const description = item["description"];
			
			md.appendText("\n\n");
			md.appendCodeblock(description);
		}

		return md;
	}
}
