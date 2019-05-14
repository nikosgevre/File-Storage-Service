const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI =
    'mongodb+srv://:@cluster0-bkjt6.mongodb.net/eidiko';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

app.use('/data', express.static(path.join(__dirname, 'data')));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        var path = 'data/' + req.session.user.email + req.session.user.userpath;
        req.session.reload( err => {
            if (err) {
                console.log('error: ' + err);
            } else {
                var path = 'data/' + req.session.user.email + req.session.user.userpath;
            }
        });
        cb(null, path);
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(
    multer({
        storage: fileStorage
    }).single('file')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

app.use(userRoutes);
app.use(authRoutes);

 app.get('/500', errorController.get500);

 app.use(errorController.get404);

 app.use((error, req, res, next) => {
     res.status(500).render('500', {
         pageTitle: 'Error!',
         path: '/500',
         isAuthenticated: req.session.isLoggedIn
     });
 });

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });
