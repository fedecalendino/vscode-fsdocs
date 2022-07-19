import * as vscode from 'vscode';

import { BaseFileSystemProvider as BaseTreeDataProvider } from "./base_tree_data_provider";
import { Entry } from "./entry"


export class MainTreeDataProvider extends BaseTreeDataProvider {
	
	protected config: any;

	constructor(config: any)
	{
		super();
		this.config = config;
	}

	getTreeItem(element: Entry): vscode.TreeItem {		
		var name: string = element.uri.toString().split("/").at(-1);

		if (name.startsWith(".") || name.startsWith("__")) {
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

		if (this.config["items"].hasOwnProperty(name)) {
			let item = this.config["items"][name];
			
			treeItem.description = this.makeTreeItemDescription(item);
			treeItem.tooltip = this.makeTreeItemTooltip(item);
		}

		return treeItem;
	}

	makeTreeItemDescription(item: any): string {
		var str = "";

		if (item.hasOwnProperty("environment")) {
			var environment = item["environment"];
			var environment_icon = this.config["environments"][environment];

			str += `${environment_icon} `;
		}

		if (item.hasOwnProperty("type")) {
			var type = item["type"];
			var type_icon = this.config["types"][type];

			str += `${type_icon} `;
		}

		str += item["label"];

		return str;
	}

	makeTreeItemTooltip(item: any): vscode.MarkdownString {
		const md = new vscode.MarkdownString();

		md.appendMarkdown(`**${item["label"]}**`);

		if (item.hasOwnProperty("environment")) {
			var environment = item["environment"];
			var environment_icon = this.config["environments"][environment];

			md.appendMarkdown(` [${environment_icon} · ${environment}]`);
		}
		
		if (item.hasOwnProperty("type")) {
			var type = item["type"];
			var type_icon = this.config["types"][type];

			md.appendMarkdown(` [${type_icon} · ${type}]`)
		}

		if (item.hasOwnProperty("description")) {
			var description = item["description"];
			
			md.appendText("\n\n")
			md.appendCodeblock(description)
		}

		return md;
	}
}
