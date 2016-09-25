'use strict';
import * as vscode from "vscode";
import * as jira from "./jira";

export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidChangeConfiguration(jira.updateConfiguration);
    let disposable = vscode.commands.registerCommand('extension.jiraSearch', () => {
        jira.updateConfiguration().then(() => jira.showIssues());
    });
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}