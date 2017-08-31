'use strict';
import * as vscode from 'vscode';
import * as jira from './jira';

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidChangeConfiguration(jira.updateConfiguration);
  let defaultSearch = vscode.commands.registerCommand('extension.jiraSearch', () => {
    jira.updateConfiguration().then(() => jira.showIssues());
  });

  let issueKeySearch = vscode.commands.registerCommand('extension.jiraSearchByIssueKey', () => {
    jira.updateConfiguration().then(() => jira.showIssueKeySearch());
  });
  context.subscriptions.push(defaultSearch, issueKeySearch);
}

// this method is called when your extension is deactivated
export function deactivate() {}
