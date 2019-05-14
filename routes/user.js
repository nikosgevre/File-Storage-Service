const path = require('path');

const express = require('express');


const {
  body
} = require('express-validator/check');
const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// Index route
router.get('/', isAuth, userController.getIndex);

// GET user route
// router.get('/user', isAuth, userController.getItems);

// GET back
router.get('/user/back', isAuth, userController.getBack);

// GET search
router.post('/user/search',
  [
    body('name')
    .isString()
  ],
  isAuth, userController.postSearch);

// GET upload file
router.get('/user/upload', isAuth, userController.getUpload);

// POST upload file
router.post('/user/upload', isAuth, userController.postUpload);

// POST delete file route  
router.post('/user/delete', isAuth, userController.postDelete);

// POST create folder
router.get('/user/create-folder', isAuth, userController.getCreateFolder);

//POST create folder
router.post('/user/create-folder', [ body('name').isString() ], isAuth, userController.postCreateFolder);

//GET Sort
router.get('/user/:sortId', isAuth, userController.getSort);

// GET file details route
router.get('/user/details/:fileId', isAuth, userController.getFile);

// POST download file route  
router.get('/user/download/:fileId', isAuth, userController.getDownload);

// GET rename file
router.get('/user/rename/:fileId', isAuth, userController.getRename);

//POST rename file
router.post(
  '/user/rename',
  [
    body('name')
    .isString()
    .isLength({
      min: 4
    })
    .trim()
  ],
  isAuth,
  userController.postRename
);

// GET PDF Preview
router.get('/user/preview/:fileId', isAuth, userController.getPreview);

// GET open folder
router.get('/user/open_folder/:folderName', isAuth, userController.getFolder);

// GET back
router.get('/user/back', isAuth, userController.getBack);

module.exports = router;