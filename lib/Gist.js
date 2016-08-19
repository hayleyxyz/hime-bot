/**
 * Created by oscar on 19/08/2016.
 */

const https = require('https');

class Gist {

    static create(body) {
        return new Promise((accept, reject) => {
            var payload = JSON.stringify(body);

            var options = {
                host: 'api.github.com',
                port: 443,
                path: '/gists',
                method: 'POST',
                headers: {
                    'host': 'api.github.com',
                    'Content-length': payload.length,
                    'Content-Type': 'application/json',
                    'User-Agent': 'HimeBot'
                }
            };

            var req = https.request(options, function(res) {
                res.body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    res.body += chunk;
                });
                res.on('end', function () {
                    var parsed = JSON.parse(res.body);
                    accept(parsed);
                });
            });

            req.end(payload);
        });
    }

}

module.exports = Gist;