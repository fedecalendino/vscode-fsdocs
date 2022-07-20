/* eslint-disable no-prototype-builtins */
import { readFileSync } from "fs";
import * as path from 'path';
import * as vscode from 'vscode';

import { CONFIG_FILENAME, EXTENSION_NAME } from "./constants";


export class Config {

	private data: JSON; 

	constructor() {
		const config_file_uri = Config.uri();
		
		try {
			if (config_file_uri === undefined)
				this.data = JSON.parse("{}");
			else {
				const file = readFileSync(config_file_uri.fsPath);
				this.data = JSON.parse(file.toString());
			}
		} catch (error) {
			if (error.code == "ENOENT")
				console.error(`${EXTENSION_NAME}: missing config file '${CONFIG_FILENAME}'.`);
			else if (error.name == "SyntaxError")
				vscode.window.showErrorMessage(`${EXTENSION_NAME}: config file is not a valid JSON file.`);
			
			this.data = undefined;
		}
	}

	public excluded(): Array<string> {
		if (!this.data.hasOwnProperty("excluded"))
			return [];
		
		return this.data["excluded"];
	}

	public getItem(name: string): JSON {
		if (!this.data["items"].hasOwnProperty(name))
			return undefined;
		
		return this.data["items"][name];
	}

	public getLabel(name: string): string {
		const item = this.getItem(name);

		if (!item || !item.hasOwnProperty("label"))
			return "";
		
		return item["label"];
	}

	public getDescription(name: string): string {
		const item = this.getItem(name);

		if (!item || !item.hasOwnProperty("description"))
			return "";
		
		return item["description"];
	}

	public getEnvironment(name: string): Array<string> {
		const item = this.getItem(name);

		if (!item || !item.hasOwnProperty("environment"))
			return [undefined, undefined];
		
		const environment = item["environment"];
		const icon = this.data["environments"][environment];

		return [environment, icon];
	}

	public getType(name: string): Array<string> {
		const item = this.getItem(name);

		if (!item || !item.hasOwnProperty("type"))
			return [undefined, undefined];
		
		const type = item["type"];
		const icon = this.data["types"][type];

		return [type, icon];
	}

	static uri(): vscode.Uri {
		if(vscode.workspace.workspaceFolders === undefined)
			return undefined;

		const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const config_file_path = path.join(workspaceRoot, CONFIG_FILENAME);
		
		return vscode.Uri.file(config_file_path);
	}

}