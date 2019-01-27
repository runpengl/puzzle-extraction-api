const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const path = require('path');
const utils = require('../utils')

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const TOKEN_PATH = path.join(__dirname, '../config/googleapis-token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../config/googleapis-credentials.json');

let credentials;

// Load client secrets from a local file.
fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    credentials = JSON.parse(content);
    authorize(JSON.parse(content));
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        if (callback) {
            callback(oAuth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

const sheets = google.sheets('v4');
exports.fetchContents = (params) => {
    return new Promise((resolve, reject) => {
        authorize(credentials, (auth) => {
            sheets.spreadsheets.values.get({
                auth: auth,
                spreadsheetId: params.spreadsheetId,
                range: params.range || "Main",
                majorDimension: "COLUMNS"
            }, (err, res) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                let columns = res.data.values;
                if (!params.range) {
                    columns.shift();
                }
                // delete empty or non-sense columns.
                columns = utils.stripEmpty(columns);
                rows = utils.transverse(columns);
                // delete empty or non-sense rows.
                rows = utils.stripEmpty(rows);
                // infer and filter for data rows.
                let columnsWithContent = 0;
                let columnsWithIndices = 0;
                const contentCounts = rows.map((row) => {
                    const emptyCount = row.filter((cell) => {
                        return cell.replace(/[^\w\-\_\?\*]/, "").length === 0;
                    }).length;
                    const digitCount = row.filter((cell) => {
                        return /[\?\-\d]+/.test(cell);
                    }).length;
                    const contentCount = row.length - emptyCount;
                    columnsWithContent = Math.max(columnsWithContent, contentCount);
                    columnsWithIndices = Math.max(columnsWithIndices, digitCount);
                    return { emptyCount: emptyCount, contentCount: contentCount, digitCount: digitCount }
                });
                rows = rows.filter((row, ri) => {
                    return contentCounts[ri].contentCount >= Math.ceil(columnsWithContent / 2) &&
                        contentCounts[ri].digitCount >= Math.ceil(columnsWithIndices / 2);
                });
                // filter out duplicate columns
                rows = utils.transverse(utils.unique(utils.transverse(rows)))
                resolve(rows);
            });
        })
    });
}