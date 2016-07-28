/**
 * Created by oscar on 20/07/2016.
 */

module.exports = {

    token: 'aaaaaa',

    erisOptions: {
        //userAccount: true
    },

    knexOptions: {
        client: 'sqlite3',
        connection: {
            filename: './db.sqlite3'
        }
    },

    soundcloud: {
        id: 'CLIENET ID',
        secret: 'CLIENT SECRET',
        uri: ''
    }

};