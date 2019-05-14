const fs = require('fs');
const mongoose = require('mongoose');
const File = require('../models/files');
const rimraf = require("rimraf");

exports.deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
        }
    });
};

exports.deleteFolder = (file) => {
    File.find({
        userpath: file.userpath,
        type: 'folder'
    }).then(result => {
        // if (!result) {
            File.deleteMany({
                userpath: file.userpath + file.name + '/'
            }).then(result => {
                rimraf(file.path, () => {
                    return console.log('Deleted folder');
                });
            });
        // } else {
            // deleteFolder(result);
        // }
    });
};
