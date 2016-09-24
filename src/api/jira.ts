import * as request from "request";
import * as vscode from "vscode";

let _settings = {
    username : "",
    password : "",
    baseUrl : "",
    headers : {
        "Content-Type": "application/json"
    }
}
let j = request.jar();

let _invoke = (route:string, method:string, data:any = null) => {
    let config = {
        headers: _settings.headers,
        method,
        jar:j
    }
    if(data){
        config["body"] = JSON.stringify(data);
    }
    return new Promise((resolve, reject)=>{
        var url = `${_settings.baseUrl}/rest${route}`;
        request(url, config, 
        (error, response, body)=>{
            if(error){
                vscode.window.showErrorMessage(`Failed JIRA request (error):${error.message}`);
                reject(error);
            }
            resolve(JSON.parse(body));
        });
    });
}
function JiraApi(baseUrl:string, username:string, password:string) {
    _settings.baseUrl = baseUrl;
    _settings.username = username;
    _settings.password = password;
}
Object.assign(JiraApi.prototype, {
    authenticate : () => {
        return new Promise((resolve, reject)=>{
            let credentials = {
                "username" : _settings.username,
                "password" : _settings.password
            }
            _invoke("/auth/latest/session", "POST", credentials)
                .then(response => {
                    var cookie = request.cookie(response["session"]["name"] + "=" + response["session"]["value"]);
                    var url =  _settings.baseUrl;
                    j.setCookie(cookie, url);
                    resolve(true);
                })
                .catch(response => reject(false))
        });
    },
    searchIssues : (qry:string = "") => {
        return new Promise((resolve, reject)=>{
            _invoke(`/api/latest/search?jql=assignee=${_settings.username}${qry}`, "GET")
            .then(response => resolve(response))
            .catch(response => reject(response));
        })
    }
})


export default JiraApi;
