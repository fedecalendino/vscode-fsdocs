/* eslint-disable no-prototype-builtins */
import { readFileSync } from "fs";
import * as path from 'path';
import * as vscode from 'vscode';

import { CONFIG_FILENAME, EXTENSION_NAME } from "./constants";


export class ConfigItem {

	public name: string;
	public label?: string;
	public description?: string;
	public environment?: string;
	public environment_icon?: string;
	public type?: string;
	public type_icon?: string;

	constructor(name: string, data: JSON, config: Config) {
		this.name = name;

		if (data.hasOwnProperty("__label__"))
			this.label = data["__label__"];
		
		if (data.hasOwnProperty("__description__"))
			this.description = data["__description__"];
		
		if (data.hasOwnProperty("__environment__")) {
			this.environment = data["__environment__"];
			this.environment_icon = config.getEnvironmentIcon(this.environment);
		}

		if (data.hasOwnProperty("__type__")) {
			this.type = data["__type__"];
			this.type_icon = config.getTypeIcon(this.type);
		}
	}

	containsSearchText(searchText: string): boolean {
		return (
			this.label && this.label.toLowerCase().includes(searchText)
		) || (
			this.description && this.description.toLowerCase().includes(searchText)
		);
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

	public ignored(): Array<string> {
		if (this.data.hasOwnProperty("excluded"))
			return this.data["excluded"];

		if (this.data.hasOwnProperty("exclude"))
			return this.data["exclude"];

		if (this.data.hasOwnProperty("ignore"))
			return this.data["ignore"];
		
		return [];
	}

	public getItem(name: string): ConfigItem {
		if (!this.data.hasOwnProperty("items"))
			return undefined;

		const separator = path.sep;
		const first =  name.split(separator).at(0);

		if (this.ignored().includes(first)) {
			return undefined;
		}

		const lookup = name.split(separator).at(-1);

		let tmp = this.data["items"];
		
		if (tmp.hasOwnProperty(lookup))
			return new ConfigItem(lookup, tmp[lookup], this);

		for (const key of name.split(separator)) {
			if (!tmp.hasOwnProperty(key)) {
				return undefined;
			}

			tmp = tmp[key];
		}	

		return new ConfigItem(name, tmp, this);
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