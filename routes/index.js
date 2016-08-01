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
        datetime: moment(row.timestamp).format(),
        formatted_time: moment(row.timestamp).format('H:m'),
        content: row.content
    };
}

router.get('/logs/:serverId', function(req, res, next) {
    var parsedDate = moment(req.query.date, 'D MMMM, YYYY');

    if(!parsedDate.isValid()) {
        parsedDate = moment();
    }

    var selectedDate = parsedDate.format('D MMMM, YYYY');

    var selectedChannelId = req.query.channel;
    if(!selectedChannelId) {
        selectedChannelId = req.params.serverId;
    }

    var serverId = req.params.serverId;

    knex(constants.TABLE_MESSAGES)
        .where('channel_id', selectedChannelId)
        .whereRaw('date(timestamp) = ?', parsedDate.format('Y-MM-DD'))
        .orderBy('timestamp', 'desc')
        .orderBy('discord_id', 'desc')
        .then((result) => {
            var messages = result.map(row => presentMessage(row));

            knex(constants.TABLE_MESSAGES)
                .select(knex.raw('date(timestamp) as date'))
                .where('channel_id', selectedChannelId)
                .groupByRaw('date(timestamp)')
                .then((result) => {
                    var dates = result.map(row => row.date);

                    knex(constants.TABLE_MESSAGES)
                        .select('channels.name', knex.raw('cast(messages.channel_id as char(50)) as channel_id'))
                        .leftJoin('channels', 'channels.channel_id', '=', 'messages.channel_id')
                        .where('messages.server_id', req.params.serverId)
                        .groupBy('messages.channel_id')
                        .then((result) => {

                            var channels = result.map(row => {
                                return { id: row.channel_id,
                                    display: '#' + row.name || row.channel_id
                                };
                            });

                            res.render('index', { serverId, messages, dates, selectedDate, channels, selectedChannelId });
                        });


                });
        });
});

module.exports = router;
