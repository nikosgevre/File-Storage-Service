const mongoose = require('mongoose');

const convertapi = require('convertapi')('Y7AKBPrjWTASl98X');

const fs = require('fs');
const path = require('path');
const fileHelper = require('../util/file');
const mkdirp = require('mkdirp');

const {
  validationResult
} = require('express-validator/check');

const File = require('../models/files');
const User = require('../models/user');

const child_process = require('child_process');

exports.getFile = (req, res, next) => {
  const fileId = req.params.fileId;
  File.findById(fileId)
    .then(file => {
      res.render('files/file-details', {
        file: file,
        pageTitle: file.name,
        path: '/user/timestampA'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getRename = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    const rdr = '/user/' + req.session.user.sort;
    // res.redirect(rdr);
    return res.redirect(rdr);
  }
  const fileId = req.params.fileId;
  File.findById(fileId)
    .then(file => {
      if (!file) {
        const rdr = '/user/' + req.session.user.sort;
        return res.redirect(rdr);
      }
      res.render('files/rename-file', {
        pageTitle: 'Rename File',
        path: '/user/rename',
        editing: editMode,
        file: file,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postRename = (req, res, next) => {
  const fileId = req.body.fileId;
  const updatedName = req.body.name;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('files/upload', {
      pageTitle: 'Upload file',
      path: '/user/upload',
      editing: true,
      hasError: true,
      file: {
        name: name,
        path: path,
        size: size,
        timestamp: timestamp,
        type: type,
        userId: req.user,
        userpath: '/'
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  File.findById(fileId)
    .then(file => {
      if (file.userId.toString() !== req.user._id.toString()) {
        const rdr = '/user/' + req.session.user.sort;
        // res.redirect(rdr);
        return res.redirect(rdr);
      }
      file.name = updatedName;
      const tempName = new Date().toISOString() + '-' + file.name;
      let new_file_path = file.path.split('/')[0] + '/' + tempName;

      fs.renameSync(file.path, new_file_path);
      file.path = new_file_path;

      return file.save().then(result => {
        console.log('Renamed File!');
        const rdr = '/user/' + req.session.user.sort;
        res.redirect(rdr);
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/',
    pageTitle: 'Dbox',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.getUpload = (req, res, next) => {
  res.render('files/upload', {
    pageTitle: 'Upload file',
    path: '/user/upload',
    save: true,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postUpload = (req, res, next) => {
  const fileId = req.user._id;
  const user = req.user;
  let file = req.file;
  let path;
  let name;
  let timestamp;
  let extension;
  let size;
  let mimetype;
  let type;
  let counter = 0;
  let userpath;


  if (!file) {
    return res.status(422).render('files/upload', {
      pageTitle: 'Upload files',
      path: '/user/upload',
      editing: false,
      hasError: true,
      file: {
        name: name,
        path: path,
        size: size,
        timestamp: timestamp,
        type: type,
        mimetype: mimetype,
        userId: req.user,
        userpath: '/'

      },
      errorMessage: 'Please try again!',
      validationErrors: []
    });
  }

  path = file.path;
  name = file.originalname;
  timestamp = new Date().toString();
  extension = name.split('.').pop();
  size = file.size;
  size = size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  mimetype = file.mimetype;
  type = mimetype.split('/')[0];
  userpath = user.userpath;

  switch (extension) {
    case "pdf":
      type = "pdf";
      break;
    case "txt":
      type = "txt";
      break;
    case "doc":
      type = "doc";
      break;
    case "docx":
      type = "docx";
      break;
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('files/upload', {
      pageTitle: 'Upload file',
      path: '/user/upload',
      hasError: true,
      file: {
        name: name,
        path: path,
        size: size,
        timestamp: timestamp,
        type: type,
        mimetype: mimetype,
        userId: req.user,
        userpath: userpath
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  File.find({
      userId: req.user._id,
      userpath: req.user.userpath
    })
    .then(result => {

      var tempName = name;
      counter = 0;
      let len = Object.keys(result).length;
      let i = 0;
      while (i < len) {
        for (let pr of result) {
          if (pr.name.includes(tempName)) {
            counter += 1;
            tempName = name.split('.')[0] + "(" + counter + ")." + name.split('.')[1];
          }
        }
        i += 1;
      }
      if (counter > 0) {
        name = tempName;
      }

      const newFile = new File({
        name: name,
        path: path,
        size: size,
        timestamp: timestamp,
        type: type,
        mimetype: mimetype,
        userId: req.user,
        userpath: userpath
      });

      var m1 = newFile.path.lastIndexOf('/');
      var m2 = newFile.path.substr(0, m1);
      console.log(m2);
      newFile.save().then(result => {
        console.log('Uploaded a file');
        const rdr = '/user/' + req.session.user.sort;
        // console.log(rdr);
        res.redirect(rdr);
        counter = 0;
      }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    });
};

// exports.getItems = (req, res, next) => {
//   File.find({ userId: req.user._id })
//   .then(files => {
//     // console.log(files);
//     res.render('files/allFiles', {
//       files: files,
//       pageTitle: 'User Files',
//       path: '/user'
//     });
//   })
//   .catch(err => {
//     const error = new Error(err);
//     error.httpStatusCode = 500;
//     return next(error);
//   });
// };

exports.postDelete = (req, res, next) => {
  const fileId = req.body.fileId;
  File.findById(fileId)
    .then(file => {
      if (!file) {
        return next(new Error('File does not exist.'));
      }
      if (file.type == 'folder') {
        fileHelper.deleteFolder(file);
        const regex = '/^' + file.userpath + file.name + '\/.*+/';
        // const regex = '/^\/New folder\/.*+/gm';
        var query = {
          userpath: regex,
          userId: req.user._id
        };
        // console.log(query);
        File.deleteMany(query, (err, obj) => {
          if (err) console.log(err);
          console.log(obj + 'deleted');
        }).then(() => {
          File.deleteOne({
            _id: fileId,
            userId: req.user._id
          }).then(() => {
            return;
          });
        });
      } else {
        fileHelper.deleteFile(file.path);
        File.deleteOne({
          _id: fileId,
          userId: req.user._id
        }).then(() => {
          return;
        });
      }
    })
    .then(() => {
      console.log('File deleted!');
      const rdr = '/user/' + req.session.user.sort;
      res.redirect(rdr);
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getDownload = (req, res, next) => {
  const fileId = req.params.fileId;
  File.findById(fileId)
    .then(file => {
      if (!file) {
        return next(new Error('No file found.'));
      }
      if (file.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      const dl = file.path;
      if (file.type != 'folder') {
        res.download(dl, file.name);
      } else {
        var new_name = file.name.replace(/ /g, '');
        child_process.execSync(`zip -r ` + new_name + ` *`, {
          cwd: dl
        });
        fl = res.download(dl + '/' + new_name + '.zip');
      }
    })
    .catch(err => next(err));
};

exports.getPreview = (req, res, next) => {
  const fileId = req.params.fileId;
  File.findById(fileId)
    .then(file => {
      let tempFile = file.path;
      if (file.type == "pdf") {
        fs.readFile(tempFile, function (err, data) {
          console.log("Preview file " + file.name);
          res.setHeader('Content-Type', file.mimetype);
          res.setHeader(
            'Content-Disposition',
            'inline; filename="' + file.path.split('/')[1] + '"'
          );
          res.send(data);
        });
      } else if (file.type == "txt") {
        tempFile = file.path.split('.txt')[0] + '.pdf';
        convertapi.convert('pdf', {
            File: file.path,
            PdfVersion: '1.3'
          }, 'txt')
          .then(result => {
            console.log('coverted a txt to pdf!');
            result.saveFiles('data')
              .then(result => {
                tempFile = result.toString();
                fs.readFile(tempFile, function (err, data) {
                  console.log(tempFile.split('/')[1]);
                  res.setHeader('Content-Type', 'application/pdf');
                  res.setHeader(
                    'Content-Disposition',
                    'inline; filename="' + tempFile.split('/')[1] + '"'
                  );
                  res.send(data);
                });
              });

          })
          .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      } else if (file.type == "doc") {
        tempFile = file.path.split('.doc')[0] + '.pdf';
        convertapi.convert('pdf', {
            File: file.path,
            PdfVersion: '1.3'
          }, 'doc')
          .then(function (result) {
            console.log('coverted a txt to pdf!');
            result.saveFiles('data')
              .then(result => {
                tempFile = result.toString();
                fs.readFile(tempFile, function (err, data) {
                  console.log(tempFile.split('/')[1]);
                  res.setHeader('Content-Type', 'application/pdf');
                  res.setHeader(
                    'Content-Disposition',
                    'inline; filename="' + tempFile.split('/')[1] + '"'
                  );
                  res.send(data);
                });
              });
          })
          .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      } else if (file.type == "docx") {
        tempFile = file.path.split('.docx')[0] + '.pdf';
        convertapi.convert('pdf', {
            File: file.path,
            PdfVersion: '1.3'
          }, 'docx')
          .then(function (result) {
            console.log('coverted a txt to pdf!');
            result.saveFiles('data')
              .then(result => {
                tempFile = result.toString();
                fs.readFile(tempFile, function (err, data) {
                  console.log(tempFile.split('/')[1]);
                  res.setHeader('Content-Type', 'application/pdf');
                  res.setHeader(
                    'Content-Disposition',
                    'inline; filename="' + tempFile.split('/')[1] + '"'
                  );
                  res.send(data);
                });
              });
          })
          .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      }
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getSort = (req, res, next) => {
  let sort = req.params.sortId;

  File.find({
      userId: req.user._id
    })
    .then(files => {
      File.find({
          userpath: req.user.userpath
        })
        .then(files => {
          if (sort == ':prev') {
            sort = req.session.user.sort;
          }
          switch (sort) {
            case "nameA":
              console.log("Sorting with name ascending");
              files.sort((a, b) => (a.name > b.name) ? 1 : -1);
              break;
            case "nameD":
              console.log("Sorting with name descending");
              files.sort((a, b) => (a.name > b.name) ? -1 : 1);
              break;
            case "sizeA":
              console.log("Sorting with size ascending");
              files.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
              break;
            case "sizeD":
              console.log("Sorting with size descending");
              files.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
              break;
            case "timestampA":
              // DEFAULT
              console.log("Sorting with timestamp ascending");
              files.sort((a, b) => b.timestamp - a.timestamp ? 1 : -1);
              break;
            case "timestampD":
              console.log("Sorting with timestamp descending");
              files.sort((a, b) => b.timestamp - a.timestamp ? -1 : 1);
              break;

          }
          req.session.user.sort = sort;
          req.session.save(err => {
            if (err) {
              console.log(err);
            }
          });
          res.render('files/allFiles', {
            files: files,
            user: req.user,
            pageTitle: 'User Files',
            path: '/user/sort'
          });
        }).catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    });

};

exports.getCreateFolder = (req, res, next) => {
  res.render('files/create-folder', {
    pageTitle: 'Create Folder',
    path: '/user/create-folder',
    editing: false,
    save: true,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postCreateFolder = (req, res, next) => {

  const user = req.user;
  const fileId = req.user._id;
  let name = req.body.name;
  let path = "data/" + user.email + user.userpath + name;
  let timestamp = new Date().toString();
  let size = '-';
  let mimetype = 'inode/directory';
  let type = 'folder';
  let userpath = user.userpath;

  File.find({
      userId: req.user._id,
      userpath: req.user.userpath
    })
    .then(result => {

      let counter = 0;
      var tempName = name;
      counter = 0;
      for (let pr of result) {
        if (pr.name.includes(tempName)) {
          counter += 1;
        }
      }
      if (counter > 0) {
        name = name + " (" + counter + ")";
      }
      path = "data/" + user.email + user.userpath + name;
      const newFile = new File({
        name: name,
        path: path,
        size: size,
        timestamp: timestamp,
        type: type,
        mimetype: mimetype,
        userpath: userpath,
        userId: req.user
      });
      newFile.save().then(result => {
        console.log('Created a folder');
        const pathm = './data/' + user.email + user.userpath + name;
        console.log(pathm);
        mkdirp(pathm, (err) => {
          if (err) console.error(err);
          else console.log('pow!');
        });
        const rdr = '/user/' + req.session.user.sort;
        // console.log(rdr);

        return res.redirect(rdr);
      }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    });
};

exports.getFolder = (req, res, next) => {
  const folderName = req.params.folderName;
  const user = req.user;
  const new_path = user.userpath + folderName + '/';
  User.findById(user._id)
    .then(user => {
      user.userpath = new_path;
      req.session.user.userpath = new_path;
      req.session.save(err => {
        if (err) {
          console.log(err);
        }
      });
      return user.save().then(result => {
        console.log('Updated User!');
        const rdr = '/user/' + req.session.user.sort;
        res.redirect(rdr);
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getBack = (req, res, next) => {
  const user = req.user;
  var m2 = user.userpath.substr(0, user.userpath.lastIndexOf("/", user.userpath.lastIndexOf("/") - 2));
  const new_path = m2 + '/';
  User.findById(user._id)
    .then(user => {
      user.userpath = new_path;
      req.session.user.userpath = new_path;
      req.session.save(err => {
        if (err) {
          console.log(err);
        }
      });
      return user.save().then(result => {
        console.log('Updated User!');
        const rdr = '/user/' + req.session.user.sort;
        res.redirect(rdr);
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSearch = (req, res, next) => {
  const searchName = req.body.name;
  let newFiles = [];
  console.log('j');
  File.find({
      userId: req.user._id,
      userpath: req.user.userpath
    })
    .then(files => {
      console.log(typeof files);
      for (let file of files) {
        console.log('orin: ' + file.name + '  ---  incl: ' + searchName);
        if (file.name.toString().includes(searchName)) {
          newFiles.push(file);
        }
      }
      res.render('files/allFiles', {
        files: newFiles,
        user: req.user,
        pageTitle: 'User Files',
        path: '/user'
      });
    });
};