# rm-meetings-gcalendar
An engine to remove a list of meetings from Google Calendar

## How to use it

### Step 1: Turn on the Google Calendar API

* Use this [wizard|https://console.developers.google.com/start/api?id=calendar] to create or select a project in the Google Developers Console and automatically turn on the API. Click Continue, then Go to credentials.
* On the Add credentials to your project page, click the Cancel button.
* At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.
* Select the Credentials tab, click the Create credentials button and select OAuth client ID.
* Select the application type Other, enter the name "Google Calendar API Quickstart", and click the Create button.
* Click OK to dismiss the resulting dialog.
* Click the Download JSON button to the right of the client ID.
* Move this file to your working directory and rename it client_secret.json.
### Step 2. Install dependencies
```bash
npm install
```
### Step 3. Run the program
```bash
./rm-meeting.js --help
```
