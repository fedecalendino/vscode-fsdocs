/* eslint-disable no-prototype-builtins */
import { readFileSync } from "fs";
import * as path from 'path';
import * as vscode from 'vscode';

import { CONFIG_FILENAME, EXTENSION_NAME } from "./constants";


export class ConfigItem {

	public label?: string;
	public description?: string;
	public environment?: string;
	public environment_icon?: string;
	public type?: string;
	public type_icon?: string;

	constructor(config: Config, data: JSON) {
		if (data.hasOwnProperty("label"))
			this.label = data["label"];
		
		if (data.hasOwnProperty("description"))
			this.description = data["description"];
		
		if (data.hasOwnProperty("environment")) {
			this.environment = data["environment"];
			this.environment_icon = config.getEnvironmentIcon(this.environment);
		}

		if (data.hasOwnProperty("type")) {
			this.type = data["type"];
			this.type_icon = config.getTypeIcon(this.type);
		}
	}
}

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

	public getItem(name: string): ConfigItem {
		if (!this.data["items"].hasOwnProperty(name))
			return undefined;
		
		return new ConfigItem(this, this.data["items"][name]);
	}

	public getEnvironmentIcon(environment: string): string {
		if (!this.data.hasOwnProperty("environments"))
			return undefined;
		
		return this.data["environments"][environment];
	}

	public getTypeIcon(type: string): string {
		if (!this.data.hasOwnProperty("types"))
			return undefined;
		
		return this.data["types"][type];
	}

	static uri(): vscode.Uri {
		if(vscode.workspace.workspaceFolders === undefined)
			return undefined;

		const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const config_file_path = path.join(workspaceRoot, CONFIG_FILENAME);
		
		return vscode.Uri.file(config_file_path);
	}
}