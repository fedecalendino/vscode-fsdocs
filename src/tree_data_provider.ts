/* eslint-disable no-prototype-builtins */
import * as vscode from 'vscode';

import { Config } from './config';
import { BaseFileSystemProvider as BaseTreeDataProvider } from "./tree_data_providers/base";
import { Entry } from "./tree_data_providers/entry";


export class MainTreeDataProvider extends BaseTreeDataProvider {
	
	protected config: Config;

	constructor(config: Config)
	{
		super();
		this.config = config;
	}

	getTreeItem(element: Entry): vscode.TreeItem {		
		const name: string = element.uri.toString().split("/").at(-1);

		if (this.config.excluded().includes(name)) {
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
				arguments: [
					element.uri
				], 
			};

			treeItem.contextValue = 'file';
		}

		if (this.config === undefined) {
			return treeItem;
		}

		// eslint-disable-next-line no-prototype-builtins
		treeItem.description = this.makeTreeItemDescription(name);
		treeItem.tooltip = this.makeTreeItemTooltip(name);

		return treeItem;
	}

	makeTreeItemDescription(name: string): string {
		let str = "";

		const [environment, environment_icon] = this.config.getEnvironment(name);

		if (environment) {
			if (environment_icon)
				str += `${environment_icon} `;
			else
				str += `${environment} `;
		}

		const [type, type_icon] = this.config.getType(name);

		if (type) {
			if (type_icon)
				str += `${type_icon} `;
			else
				str += `${type} `;
		}

		str += this.config.getLabel(name);

		return str;
	}

	makeTreeItemTooltip(name: string): vscode.MarkdownString {
		const md = new vscode.MarkdownString();

		const label = this.config.getLabel(name);
		const description = this.config.getDescription(name);

		md.appendMarkdown(`**${label}**`);

		const [environment, environment_icon] = this.config.getEnvironment(name);

		if (environment) {
			md.appendMarkdown(` [${environment_icon} · ${environment}]`);
		}
		
		const [type, type_icon] = this.config.getType(name);

		if (type) {
			md.appendMarkdown(` [${type_icon} · ${type}]`);
		}

		if (description) {
			md.appendText("\n\n");
			md.appendCodeblock(description);
		}

		return md;
	}
}
