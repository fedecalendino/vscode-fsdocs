'use strict';

import * as vscode from 'vscode';

import { FSDocsFileExplorer } from './file_explorer';

export function activate(context: vscode.ExtensionContext) {
	new FSDocsFileExplorer(context);
}