import * as vscode from 'vscode';


export function getFilename(path: string | vscode.Uri): string | undefined {
	if (path === undefined)
		return undefined;
	
	return path.toString().split("/").at(-1);
}
