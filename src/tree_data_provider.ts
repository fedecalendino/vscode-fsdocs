/* eslint-disable no-prototype-builtins */
import * as vscode from 'vscode';

import { Config, ConfigItem } from './config';
import { BaseFileSystemProvider as BaseTreeDataProvider } from "./tree_data_providers/base";
import { Entry } from "./tree_data_providers/entry";
import * as utils from './utils';


export class MainTreeDataProvider extends BaseTreeDataProvider {
	
	protected config: Config;
	protected searchText: string;

	constructor(config: Config, searchText?: string)
	{
		super();
		this.config = config;
		this.searchText = searchText;
	}

	getTreeItem(element: Entry): vscode.TreeItem {		
		const name = utils.getFilename(element.uri);

		let collapsedState = vscode.TreeItemCollapsibleState.None;

		if (element.type === vscode.FileType.Directory)
			collapsedState = vscode.TreeItemCollapsibleState.Collapsed; 

		const treeItem = new vscode.TreeItem(element.uri, collapsedState);
		
		if (element.type === vscode.FileType.File) {
			treeItem.contextValue = 'file';
			treeItem.command = { 
				command: 'fsdocs-file-explorer.open-file', 
				title: "Open File", 
				arguments: [element.uri], 
			};
		}

		if (this.config === undefined)
			return treeItem;

		const item = this.config.getItem(name);

		if (item !== undefined) {
			treeItem.description = this.makeTreeItemDescription(item);
			treeItem.tooltip = this.makeTreeItemTooltip(item);
		}

		return treeItem;
	}

	makeTreeItemDescription(item: ConfigItem): string {
		if (item === undefined) {
			return "";
		}
		let str = "";

		if (item.environment) {
			if (item.environment_icon)
				str += `${item.environment_icon} `;
			else
				str += `${item.environment} `;
		}

		if (item.type) {
			if (item.type_icon)
				str += `${item.type_icon} `;
			else
				str += `${item.type} `;
		}

		if (item.label !== undefined) {
			str += `${item.label}`;
		}

		if (this.searchText && item.containsSearchText(this.searchText))
			str += `  🔍`;		
		
		return str;
	}

	makeTreeItemTooltip(item: ConfigItem): vscode.MarkdownString {
		const md = new vscode.MarkdownString();

		md.appendMarkdown(`**${item.label}**`);

		if (item.environment) {
			if (item.environment_icon)
				md.appendMarkdown(` [${item.environment_icon} · ${item.environment}]`);
			else
				md.appendMarkdown(` [${item.environment}]`);
		}
		
		if (item.type) {
			if (item.type_icon)
				md.appendMarkdown(` [${item.type_icon} · ${item.type}]`);
			else
				md.appendMarkdown(` [${item.type}]`);
		}

		if (item.description) {
			md.appendText("\n\n");
			md.appendCodeblock(item.description);
		}

		return md;
	}
}
