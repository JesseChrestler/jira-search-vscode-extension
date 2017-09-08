import * as request from 'request';
import * as vscode from 'vscode';

let _config = {
  username: '',
  password: '',
  baseUrl: '',
  headers: {
    'Content-Type': 'application/json'
  },
  hasAuthenticated: false
};
let j = request.jar();
export function canInvoke() {
  return _config.baseUrl !== '' && _config.username != '' && _config.password !== '';
}
let _invoke = (route: string, method: string, data: any = null) => {
  let config = {
    headers: _config.headers,
    method,
    jar: j
  };
  if (data) {
    config['body'] = JSON.stringify(data);
  }
  return new Promise((resolve, reject) => {
    if (!canInvoke) {
      throw 'Jira Search requires configuration of url, username, and password to work.';
    }

    var url = `${_config.baseUrl}/rest${route}`;
    request(url, config, (error, response, body) => {
      if (error) {
        vscode.window.showErrorMessage(`Failed JIRA request (error):${error.message}`);
        reject(error);
      }
      var isNotAuthRoute = route !== '/auth/latest/session';
      if ((isNotAuthRoute && response.statusCode === 401) || (isNotAuthRoute && !_config.hasAuthenticated)) {
        //we need to revalidate the authentication.
        authenticate().then(function() {
          //then we recall our orignal call
          _invoke(route, method, data).then(response => resolve(response));
        });
      } else {
        let data = {};
        if (body !== '') {
          data = JSON.parse(body);
        }
        resolve(data);
      }
    });
  });
};
export function authenticate() {
  return new Promise((resolve, reject) => {
    let credentials = {
      username: _config.username,
      password: _config.password
    };
    _invoke('/auth/latest/session', 'POST', credentials)
      .then(response => {
        var cookie = request.cookie(response['session']['name'] + '=' + response['session']['value']);
        var url = _config.baseUrl;
        j.setCookie(cookie, url);
        _config.hasAuthenticated = true;
        resolve(true);
      })
      .catch(response => reject(false));
  });
}
export function getTransitions(issueKey: string) {
  return new Promise((resolve, reject) => {
    _invoke(`/api/latest/issue/${issueKey}/transitions`, 'GET')
      .then(response => resolve(response))
      .catch(response => reject(response));
  });
}
export function setTransition(issueKey: string, transitionId: string) {
  return new Promise((resolve, reject) => {
    _invoke(`/api/latest/issue/${issueKey}/transitions`, 'POST', { transition: { id: transitionId } })
      .then(response => resolve(response))
      .catch(response => reject(response));
  });
}
export function addComment(issueKey: string, comment: string) {
  return new Promise((resolve, reject) => {
    _invoke(`/api/latest/issue/${issueKey}/comment`, 'POST', { body: comment })
      .then(response => resolve(response))
      .catch(response => reject(response));
  });
}
export function getComments(issueKey: string) {
  return new Promise((resolve, reject) => {
    _invoke(`/api/latest/issue/${issueKey}/comment`, 'GET')
      .then(response => resolve(response))
      .catch(response => reject(response));
  });
}
export function searchIssues(qry: string = '') {
  return new Promise((resolve, reject) => {
    _invoke(`/api/latest/search?jql=${qry}`, 'GET')
      .then(response => resolve(response))
      .catch(response => reject(response));
  });
}
export function getIssue(issueKey: string) {
  return new Promise((resolve, reject) => {
    _invoke(`/api/latest/issue/${issueKey}`, 'GET')
      .then(response => resolve(response))
      .catch(response => reject(response));
  });
}

export function getPossibleAssigneesForIssue(issueKey: string) {
  return new Promise((resolve, reject) => {
    _invoke(`/api/latest/user/permission/search?permissions=ASSIGNABLE_USER&issueKey=${issueKey}`, 'GET')
      .then(response => {
        resolve(response);
      })
      .catch(err => reject(err));
  });
}

export function setAssigneeForIssue(issueKey: string, username: string) {
  return new Promise((resolve, reject) => {
    _invoke(`/api/latest/issue/${issueKey}/assignee`, 'PUT', { name: username })
      .then(response => {
        resolve(response);
      })
      .catch(err => {
        resolve(err);
      });
  });
}

export function setConfig(baseUrl: string, username: string, password: string) {
  _config.baseUrl = baseUrl;
  _config.username = username;
  _config.password = password;
  _config.hasAuthenticated = false;
}
