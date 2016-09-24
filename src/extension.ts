'use strict';
import * as vscode from 'vscode';
import JiraApi from "./api/jira";
import * as copypaste from "copy-paste";

export function activate(context: vscode.ExtensionContext) {
    let jiraSettings = {
        url : "",
        username : "",
        password : "",
        label : function(issue){
            return issue.key;
        },
        description : function(issue){
            return issue.fields.summary;
        },
        detail : function (issue){
            return issue.fields.description;
        }
    };
    let jiraApi;
    let setConfiguration = () => {
        let config = vscode.workspace.getConfiguration("jiraSearch");
        jiraSettings.url = config.get("url", "");
        jiraSettings.username = config.get("username", "");
        jiraSettings.password = config.get("password", "");
        if(jiraSettings.url !== "" && jiraSettings.username != "" && jiraSettings.password !== "" ){
            jiraApi = new JiraApi(jiraSettings.url, jiraSettings.username, jiraSettings.password);
        }else{
            jiraApi = undefined;
        }

    }
    let disposable = vscode.commands.registerCommand('extension.jiraSearch', () => {
        // The code you place here will be executed every time your command is executed
        setConfiguration();
        vscode.workspace.onDidChangeConfiguration(setConfiguration)
        var jiraSearchConfig = vscode.workspace.getConfiguration("jiraSearch");
        console.log(jiraSearchConfig);

        const mapJiraToQuickPickItem = (item) => {
            let quickpick:vscode.QuickPickItem = {
                label : jiraSettings.label(item),
                description : jiraSettings.description(item),
                detail : jiraSettings.detail(item)
            }
            return quickpick;
        };
        const quickPickOptions:vscode.QuickPickOptions = {
            ignoreFocusOut : true,
            matchOnDescription : true,
            matchOnDetail : true
        };
        if(!jiraApi){
            vscode.window.showErrorMessage("You must configure JIRA settings before using JIRA Search Plugin.");
            return;
        }
        jiraApi.authenticate().then(authResponse => {
            jiraApi.searchIssues().then(issueResponse => {
                vscode.window.showQuickPick(
                    issueResponse["issues"].map(mapJiraToQuickPickItem), 
                    quickPickOptions
                ).then(result => {
                    console.log(result);
                    var copydata = result;
                    if(typeof result !== "string"){
                        copydata = `${result["label"]} - ${result["description"]} - ${result["detail"]}`;
                    }
                    copypaste.copy(copydata, 
                        (err) => {
                            if(err) vscode.window.showErrorMessage(err.message);
                            else vscode.window.showInformationMessage("Copied JIRA issue to clipboard.");
                        }
                    );
                });
            });
        });
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}