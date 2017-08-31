import { workspace, window, QuickPickItem, QuickPickOptions, MessageItem, InputBoxOptions } from 'vscode';
import * as jiraApi from './api/jira';
import getConfiguration from './config';
import * as copypaste from 'copy-paste';

let jiraConfig = getConfiguration();

/**
 * List of JIRA issues returned by the "Search my issues" command.
 * @type {object}
 */
let jiraIssues = [];

/**
 * jiraIssues as well as any other issues mapped to an object by formatted label for easy access throughout menus.
 * @type {object}
 */
let jiraIssueMap = {};

let jiraQuickPicks = [];

let jiraLastUpdateDate = Date.now();

let jiraUpdateIntervalId;

let initialized = false;

const jiraQuickPickOptions: QuickPickOptions = {
  ignoreFocusOut: true,
  matchOnDescription: true,
  matchOnDetail: true
};
//listen for changes and update the configuration

export function updateConfiguration(): Thenable<any> {
  return new Promise((resolve, reject) => {
    jiraConfig = getConfiguration();
    jiraApi.setConfig(jiraConfig.url, jiraConfig.username, jiraConfig.password);
    if (jiraApi.canInvoke()) {
      //this needs to be more intilligent to know which configuration fields changed.
      if (!initialized) {
        jiraApi.authenticate().then(resolve);
      } else {
        resolve();
      }
      if (jiraConfig.updateInterval > 0) {
        clearInterval(jiraUpdateIntervalId);
        jiraUpdateIntervalId = setInterval(jiraUpdate, jiraConfig.updateInterval * 60 * 1000);
      }
      initialized = true;
    } else {
      initialized = false;
      window.setStatusBarMessage('Jira Search requires configuration of url, username, and password to work.', 5000);
      resolve();
    }
  });
}
function jiraUpdate(): Thenable<any> {
  return new Promise((resolve, reject) => {
    window.setStatusBarMessage('Fetching issues from JIRA', 1000);
    jiraApi.searchIssues(parseTokens(jiraConfig, jiraConfig.jql)).then(issues => {
      updateIssues(issues);
      resolve(issues);
    });
  });
}
function parseTokens(obj: any, format: string): string {
  let regex = /\{[^\}]+\}/g;
  let tokens = format.match(regex);
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    format = format.replace(token, tokenToValue(obj, token));
  }
  return format;
}

/**
 * Calls parseTokens for the passed issue object.
 * The format is defaulted to the configuration value
 * @param {*} issue 
 */
function parseIssueLabelTokens(issue: any) {
  return parseTokens(issue, jiraConfig.labelFormat);
}

function tokenToValue(obj: any, namespace: string): string {
  let names = namespace.replace(/[{}]*/g, '').split('.');
  for (let i = 0; i < names.length; i++) {
    if (obj) obj = obj[names[i]];
  }
  //we don't need to see the word null or undefined
  if (obj === undefined || obj === null) {
    obj = '';
  }
  return obj;
}
function updateIssues(response: any): void {
  window.setStatusBarMessage('JIRA issues assigned to you have been updated.', 10000);
  jiraIssues = response.issues.slice();
  //need a good way to map quickpicks to issues.
  jiraIssueMap = {};
  jiraIssues.forEach(issue => {
    let id = parseIssueLabelTokens(issue);
    jiraIssueMap[id] = issue;
  });

  jiraQuickPicks = response.issues.map(issueToQuickPick);
  jiraLastUpdateDate = Date.now();
}
function issueToMessage(issue): string {
  return parseTokens(issue, jiraConfig.updateFormat);
}
function issueToQuickPick(issue): QuickPickItem {
  let quickPickItem: QuickPickItem = {
    label: parseIssueLabelTokens(issue),
    description: parseTokens(issue, jiraConfig.descriptionFormat),
    detail: parseTokens(issue, jiraConfig.detailFormat)
  };
  return quickPickItem;
}
function copyIssueToClipboard(issue): void {
  let copydata = parseTokens(issue, jiraConfig.clipboardFormat);
  copypaste.copy(copydata, err => {
    if (err) window.showErrorMessage(err.message);
    else window.setStatusBarMessage('Copied JIRA issue to clipboard.', 5000);
  });
}
function commentToQuickPick(comment): QuickPickItem {
  let quickPickItem: QuickPickItem = {
    label: `[${comment.author.displayName}]`,
    description: comment.body,
    detail: ''
  };
  return quickPickItem;
}
function showComments(issue): void {
  jiraApi.getComments(issue.key).then(response => {
    let comments = response['comments'];
    let label = parseIssueLabelTokens(issue);
    if (comments.length == 0) {
      window.showInformationMessage(`No comments found for issue ${label}`, 'Go back').then((selection: string) => {
        if (selection !== undefined) {
          showSelectionOptions({ label: parseIssueLabelTokens(issue) });
        }
      });
    } else {
      window.showQuickPick(comments.map(commentToQuickPick)).then(row => {
        showSelectionOptions({ label: parseIssueLabelTokens(issue) });
      });
    }
  });
}
function addComment(issue): void {
  let label = parseIssueLabelTokens(issue);
  let inputBoxOptions: InputBoxOptions = {
    ignoreFocusOut: true,
    prompt: `Add Comment To ${label}`
  };
  window.showInputBox(inputBoxOptions).then(comment => {
    jiraApi.addComment(issue.key, comment).then(() => {
      window.setStatusBarMessage(`Successfully added comment to JIRA ${label}`);
    });
  });
}
function showTransitionOptions(issue): void {
  let label = parseIssueLabelTokens(issue);
  let currentTransition = issue.fields.status.name;
  jiraApi.getTransitions(issue.key).then(response => {
    let transitions = response['transitions'];
    window
      .showQuickPick(
        transitions.map(transition => {
          let name = transition.name;
          if (name == currentTransition) {
            name = '[current] ' + name;
          }
          return name;
        })
      )
      .then(transitionName => {
        if (transitionName !== currentTransition) {
          var newTransition = transitions.filter(transition => transition.name == transitionName)[0];
          jiraApi.setTransition(issue.key, newTransition.id).then(() => {
            jiraUpdate().then(() => {
              window.setStatusBarMessage(`Successfully transitioned JIRA ${label} to [${transitionName}]`);
            });
          });
        } else {
          window.setStatusBarMessage(`JIRA ${label} is already in status [${transitionName}]`);
        }
      });
  });
}
/**
 * 
 * @param {*} quickPickItem Contains "label" which should be the issue key
 */
function showSelectionOptions(quickPickItem: any): void {
  let selectedIssue = jiraIssueMap[quickPickItem.label];
  let cancelButton: MessageItem = {
    isCloseAffordance: true,
    title: 'Cancel'
  };
  window
    .showInformationMessage(
      `Perform Which Action on ${quickPickItem.label}?`,
      cancelButton,
      { title: 'Copy' },
      { title: 'Add Comment' },
      { title: 'View Comments' },
      { title: 'Transition' }
    )
    .then(result => {
      switch (result.title) {
        case 'Copy':
          copyIssueToClipboard(selectedIssue);
          break;
        case 'View Comments':
          showComments(selectedIssue);
          break;
        case 'Add Comment':
          addComment(selectedIssue);
          break;
        case 'Transition': {
          showTransitionOptions(selectedIssue);
        }
        default:
          break;
      }
    });
}
export function showIssues() {
  if (jiraQuickPicks.length === 0) {
    jiraUpdate().then(showIssues);
  } else {
    window.showQuickPick(jiraQuickPicks, jiraQuickPickOptions).then(showSelectionOptions);
  }
}

/**
 * Allows the user to search for a specific
 * issue using the issue key.
 */
export function showIssueKeySearch() {
  let inputBoxOptions: InputBoxOptions = {
    ignoreFocusOut: true,
    prompt: `Enter an issue key`
  };
  window.showInputBox(inputBoxOptions).then((issueKey: string) => {
    window.setStatusBarMessage(`Fetching issue ${issueKey}`, 1500);
    jiraApi
      .getIssue(issueKey)
      .then((response: any) => {
        if (response === null) {
          throw Error('No response from JIRA');
        } else if (response.errorMessages && response.errorMessages.length > 0) {
          throw Error(response.errorMessages[0]);
        }
        let issueLabel = parseIssueLabelTokens(response);
        jiraIssueMap[issueLabel] = response;
        showSelectionOptions({ label: issueLabel });
      })
      .catch(err => {
        window.showErrorMessage(err.message);
      });
  });
}
