var express = require('express');
var router = express.Router();

var moment = require('moment');
var bookshelf = require('../bookshelf');
var models = require('../models')(bookshelf);

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/:serverId/logs/:channelId', function(req, res, next) {
  new models.Message({
          server_id: req.params.serverId,
          channel_id: req.params.channelId
      })
      .fetch()
      .then(function(models) {
          var messages = [ ];

          if(models.length > 0) {
              models.map(function (item) {
                  messages.push({
                      author_name: item.attributes.member_nickname || item.attributes.member_username,
                      timestamp: item.attributes.timestamp,
                      content: item.attributes.content
                  });
              });
          }

          res.render('index', { title: '111', messages: messages });
      });
});

module.exports = router;
