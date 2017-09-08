# JIRA Search Extension README

This is a simple extension that allows you to search your JIRA issues assigned to you.
Possibly in the future I will add other search/queries you can perform. 

## Installation

This is currently not published in the visual studio code market.
Simply run the following command:

`code --install-extension jira-search-0.3.0.vsix`

## Usage

Type "Jira Search My Issues"

## Features

* View issues assigned to you
* View comments on issues
* Add comments to issues
* Transition issues from one status to another

*Tip*: The list that shows when you execute the command can be filtered as you type.

## Extension Settings

This extension contributes the following settings:
### Configuration Required Fields

`jiraSearch.url` - base url for your jira site (ex. "http://mysite.jira.com")

`jiraSearch.username` - username for your jira account (typically not the email address)

`jiraSearch.password` - Password for your jira account

```
"jiraSearch.url" : "http://mysite.jira.com",
"jiraSearch.username" : "username",
"jiraSearch.password" : "password"
```

### Configuration (optional) 

 #### How JIRA issues will be displayed you can customize this based on your custom fields in your JIRA implementation

`jiraSearch.labelFormat` - The first part of an issue listing

`jiraSearch.descriptionFormat` - Second part. Smaller text next to the label. Issue summary by default.

`jiraSearch.detailFormat` - Appears below the label and description. Default is the issue description.

```
"jiraSearch.labelFormat" : "{fields.status.name} - [{fields.issuetype.name}][{fields.priority.name}] {key}",
"jiraSearch.descriptionFormat" : "{fields.summary}",
"jiraSearch.detailFormat" : "{fields.description}"
```

For example, the provided `labelFormat` will appear like this:

> TODO - [Bug][Major] ISSUE-1337

#### How JIRA issues will be copied to your clipboard

```
"jiraSearch.clipboardFormat": "{key} - {fields.summary} - {fields.description}"
```

#### JQL (Jira Query Language) query format (only token available is username currently). Currently will give all issues assigned to you, where status is not done, and it will be ordered by created date.
 
```
"jiraSearch.jql" : "assignee={username} and status!=Done order by created"
```

#### How often to update issues (in minutes)

```
"jiraSearch.updateInterval" : 5
```

#### Enable Worklogs

Worklog support is an experimental feature that could use a tester. It is disabled by default.

When enabled (set this option to `true`) you can view and add worklogs to an issue.

This feature does _not_ work properly with third party time tracking plugins such as Tempo.

```
"jiraSearch.enableWorklogs: false
```

## Known Issues

Issues will not get pulled everytime you run the command, they will only get pulled when you run the command the first time and then they will be pulled every X interval (default 5 minutes) which is customizable.

## Release Notes

### 0.3.0

* Added experimental worklog support (add and view worklogs!)
* Changed the task menu to a quickpick so you no longer need a mouse
* Change the assignee of an issue
* Added placeholders to quickpick menus to make things a little more user-friendly
* Added missing timeouts to status bar updates
* Return to menu after transitioning issues, viewing comments, etc.

### 0.2.0 

* Automatically register configuration options
* New command to look up an issue by key ("Jira View Issue")
* Return to the menu after closing the comment list 
* Option to return to the menu if no comments are found

### 0.1.0

* Refactored code to be more modular.
* Added ability to view comments on issue.
* Added ability to add comments to issues.
* Added ability to transition issues from one status to another.
* Added better customization support for queries and how things will be displayed.

### 0.0.1

Initial release of Jira Search Extension
