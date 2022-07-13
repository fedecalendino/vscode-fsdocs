'use strict';

import * as vscode from 'vscode';

import { FSDocsExplorer } from './explorer';

export function activate(context: vscode.ExtensionContext) {
	new FSDocsExplorer(context);
}