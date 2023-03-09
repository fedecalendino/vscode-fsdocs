import * as vscode from 'vscode';
import * as path from 'path';


export function getFilename(file: vscode.Uri): string | undefined {
	if (file === undefined)
		return undefined;

	const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
	const relative = path.relative(root, file.fsPath);

	return relative.toString();
}
