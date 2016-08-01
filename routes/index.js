var express = require('express');
var router = express.Router();

const moment = require('moment');
const config = require('../config');
const knex = require('knex')(config.knexOptions);
const constants = require('../constants');
const util = require('util');

function presentMessage(row) {

    var username_nick = row.member_nickname ? util.format('%s (%s)', row.member_nickname, row.member_username) :
        row.member_username;

    return {
        username_nick,
        formatted_time: moment(row.timestamp).format('H:m'),
        content: row.content
    };
}

router.get('/:serverId/logs/:channelId', function(req, res, next) {
    var parsedDate = moment(req.query.date, 'D MMMM, YYYY');
    
    if(!parsedDate.isValid()) {
        parsedDate = moment();
    }

    var selectedDate = parsedDate.format('D MMMM, YYYY');

    knex(constants.TABLE_MESSAGES)
        .where('server_id', req.params.serverId)
        .where('channel_id', req.params.channelId)
        .whereRaw('date(timestamp) = ?', parsedDate.format('Y-MM-DD'))
        .then((result) => {
            var messages = result.map(row => presentMessage(row));

            knex(constants.TABLE_MESSAGES)
                .select(knex.raw('date(timestamp) as date'))
                .where('server_id', req.params.serverId)
                .where('channel_id', req.params.channelId)
                .groupByRaw('date(timestamp)')
                .then((result) => {
                    var dates = result.map(row => row.date);

                    res.render('index', { title: '111', messages: messages, dates: dates, selectedDate: selectedDate });
                });
        });
});

module.exports = router;
