var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  console.log('index was called');
  res.render('index', { user: req.user, title: 'Express' });
});

module.exports = router;
