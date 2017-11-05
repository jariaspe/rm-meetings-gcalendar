#!/usr/bin/env node

'use strict';

const fs = require('fs');
const Program = require('commander');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';
var eventList;
/**
 * Read the params passed to the app
 */
function configureAcceptedCliParams() {
    Program
        .version('1.0.0')
        .usage('[options] <meeting-name>')
        .description('  An engine to remove a list of meetings from Google Calendar.')
        .option('-l, --list', 'Show the list of events.')
        .option('-s, --simulated', 'It will just show the events to be removed, but no one will be deleted')
        .parse(process.argv);
}
configureAcceptedCliParams();
// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), listEvents);
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

function listCalendars(auth) {
    var calendar = google.calendar('v3');
    calendar.calendarList.list({
        auth: auth,
        timeMin: (new Date()).toISOString(),
        maxResults: 1000,
        orderBy: 'startTime'
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var calendars = response.items;
        if (calendars.length == 0) {
            console.log('No upcoming events found.');
        } else {
            console.log('Upcoming 10 events:');
            for (var i = 0; i < calendars.length; i++) {
                var calendar = calendars[i];
                console.log('%s - %s', calendar.summary, calendar.id);
            }
        }
    });
}
/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
    var calendar = google.calendar('v3');
    const options = {
        auth: auth,
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        q: Program.args[0] || '',
        maxResults: 10
    };
    calendar.events.list(options, function (err, response) {
        if (err) {
            console.error('The API returned an error: ' + err);
            return;
        }
        eventList = response.items;
        const eventsLength = eventList.length;

        if (eventsLength == 0) {
            console.log('No upcoming events found.');
        } else {
            console.log('Upcoming %d events', eventsLength);
            if (Program.list) {
                eventList.forEach(event => {
                    var eventId = event.id;
                    const start = event.start.dateTime || event.start.date;
                    console.log("Summary: %s - Start: %s - EventId: %s", event.summary, start, event.id);
                });
            }
            if (!Program.simulated) {
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                rl.question(eventsLength + ' events will be remove. Do you want to continue (S/n)? ', (answer) => {
                    if (answer === '' || answer === 'S') {
                        deleteEvents(eventList);
                    }
                    rl.close();
                });
            }
        }
    });
}

function deleteEvents(events) {
    
    events.forEach(event => {
        if (event.status !== 'cancelled') {
            var request = calendar.events.delete({
                auth: auth,
                eventId: eventId,
                calendarId: 'primary'
            }, function (getErr, getResponse) {
                if (getErr) {
                    console.error('Error deleting: ' + getErr);
                    return;
                }

            });
        }
    });
    console.log("Events removed successfully.")
}