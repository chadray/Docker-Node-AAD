var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var http = require('http');
var https = require('https');
var fs = require('fs');
var util = require('util');

var passport = require('passport');
var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

var config = require('./config');
var index = require('./routes/index');

// array to hold logged in users
var users = [];

//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function (user, done) {
  done(null, user.oid);
});

passport.deserializeUser(function (id, done) {
  findByOID(id, function (err, user) {
    done(err, user);
  });
});


var findByOID = function (oid, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];

    if (user.oid === oid) {
      return fn(null, user);
    }
  }
  console.log("Did not find user by OID: " + oid);
  return fn(null, null);
};

// Use the OIDCStrategy within Passport. (Section 2) 
// 
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier), and invoke a callback
//   with a user object.
passport.use(new OIDCStrategy({
  callbackURL: config.creds.returnURL,
  redirectUrl: config.creds.redirectUrl,
  realm: config.creds.realm,
  clientID: config.creds.clientID,
  clientSecret: config.creds.clientSecret,
  oidcIssuer: config.creds.issuer,
  identityMetadata: config.creds.identityMetadata,
  skipUserProfile: config.creds.skipUserProfile,
  responseType: config.creds.responseType,
  responseMode: config.creds.responseMode,
  scope: config.creds.scope
},
  function (iss, sub, profile, accessToken, refreshToken, done) {
    if (!profile.oid) {
      console.log(util.inspect(profile));
      return done(new Error("No OID found"), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(function () {
      findByOID(profile.oid, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      });
    });
  }
));




var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: false
}));
//Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));




// Our Auth routes (section 3)

// GET /auth/openid
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in OpenID authentication involves redirecting
//   the user to their OpenID provider. After authenticating, the OpenID
//   provider redirects the user back to this application at
//   /auth/openid/return.
app.get('/auth/openid',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
  function (req, res) {
    console.log('Authentication was called in the Sample');
    res.redirect('/');
  });

// GET /auth/openid/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user is redirected back to the
//   sign-in page. Otherwise, the primary route function is called,
//   which, in this example, redirects the user to the home page.
app.get('/auth/openid/return',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
  function (req, res) {
    console.log('We received a return from AzureAD.');
    res.redirect('/');
  });

// POST /auth/openid/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user is redirected back to the
//   sign-in page. Otherwise, the primary route function is called,
//   which, in this example, redirects the user to the home page.
app.post('/auth/openid/return',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
  function (req, res) {
    console.log('We received a return from AzureAD.');
    res.redirect('/');
  });



//Routes (section 4)

app.get('/', index);

app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account', { user: req.user });
});

app.get('/login',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
  function (req, res) {
    console.log('Login was called in the Sample');
    res.redirect('/');
  });

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// Simple route middleware to ensure user is authenticated. (section 4)

//   Use this route middleware on any resource that needs to be protected. If
//   the request is authenticated (typically via a persistent sign-in session),
//   the request proceeds. Otherwise, the user is redirected to the
//   sign-in page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

// This line is from the Node.js HTTPS documentation.
var options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

//http.createServer(app).listen(8080);
https.createServer(options, app).listen(443);
module.exports = app;
