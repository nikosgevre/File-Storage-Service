

# File Storage Service

## Summary
Dropbox like file storage service. It can support multiple users. The user can create folders, delete folders and upload and download files. The user is able to rename and see the details of each file. Furthermore, the user can view doc, docx, pdf or txt files on the browser. User authentication is implemented in the project and all the actions require authentication.

## Development
The web application is developed on NodeJS, ExpressJs and ejs view engine. Javascript, NodeJs and ExpressJs was used fot the backend and the ejs view engine was used for the frontend. Mongodb and mongoose were used for the database.

***

#### Services provided to the user
##### User Interface
* Sign up
* Sign in
* Reset password

##### Services
* File upload
* File download
* File rename
* Create folder
* Delete folder
* Rename folder
* Sort viewing list
* Details of file/folder

#### Bugs
* Deleting folders is only working in one level. All sub directories and their files are deleted from the server but not from the database.

***

## How to run
1. Download and install nodejs
2. Install npm in the directory of the code: npm install (Might be ok after this step)
3. Install shell package through npm: npm install shelljs --save
4. Run the package-installer.js to download and install all the required modules
5. To start the web app: npm start
6. Open browser and go to: [localhost:3000/](127.0.0.1:3000/)

***

#### Author: Nikos Gkevrekis AEM:1611

***
#### Requirments
In order to use the application it is required to have a free mongodb account and a free sendgrid account. The two required keys have been removed from this repository and you must user your own mongodb URI and sendgrid api key!
* mondodb URI is set in app.js
* sendgrid api key is set in controllers/auth.js

