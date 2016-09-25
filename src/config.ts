import {workspace} from 'vscode';
const defaultConfig = {
    url : "",
    username : "",
    password : "",
    //how to display each issue
    labelFormat : "{fields.status.name} - [{fields.issuetype.name}][{fields.priority.name}] {key}",
    descriptionFormat : "{fields.summary}", 
    detailFormat : "{fields.description}",
    //data to copy
    clipboardFormat: "{key} - {fields.summary} - {fields.description}",
    updateFormat: "{key} - {field.summary}",
    //jql (Jira Query Language) query format (only token available is username currently)
    //currently will give all issues assigned to you, where status is not done, and it will be ordered by created date.
    jql: "assignee={username} and status!=Done order by created",
    //how often to update (in minutes)
    updateInterval : 5
}
let jiraConfig = Object.assign({}, defaultConfig);

export default function getConfiguration(){
    let config = workspace.getConfiguration("jiraSearch");
    for(var field in defaultConfig){
        jiraConfig[field] = config.get(field, defaultConfig[field]);
    }
    return jiraConfig;
}