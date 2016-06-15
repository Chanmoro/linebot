var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var bodyParser = require('body-parser');
var httpRequest = require('request');
var basicAuth = require('basic-auth-connect');
var config = require('config');
var log4js = require('log4js');
var url = require('url')

// Express setting
var app = express()
app.disable('x-powered-by'); // Disable 'X-Powered-By: Express' header
var port = process.env.PORT || 5000

log4js.configure(config.log4js);
var logger = log4js.getLogger('application');

app.use(express.static(__dirname + "/"))
app.use(log4js.connectLogger(log4js.getLogger('access'), { level: log4js.levels.INFO, format: ':remote-addr - - ":method :url HTTP/:http-version" :status :response-timems :content-length ":referrer" ":user-agent"' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();
router.get('/status', function(request, response) {
    response.status(200);
    response.json({ status: http.STATUS_CODES[200] });
});
router.post('/', function(request, response) {
    var json = request.body;
    logger.info(json);
    broadcast(json);

    response.status(200);
    response.json({ status: http.STATUS_CODES[200] });
});
app.use('/', router);

app.use(function(request, response, next) {
    response.status(404);
    response.json({ status: http.STATUS_CODES[404] });
});

var server = http.createServer(app)
server.listen(port)

logger.info("http server listening on %d", port)

// WebSocket server setting
var wss = new WebSocketServer({ server: server, path: '/ws' })
var ws_connections = [];

wss.on("connection", function(ws) {
    var location = url.parse(ws.upgradeReq.url, true);
    logger.info(location);
    logger.info(ws.upgradeReq.headers);
    ws_connections.push(ws);

    logger.info("websocket connection open");

    ws.on('message', function(data) {
        var obj = JSON.parse(data);
        logger.info("received message");
        logger.info(obj);
        sendResponse(obj);
    });

    ws.on("close", function() {
        logger.info("websocket connection close");
        // remove closed connection from connection list
        ws_connections = ws_connections.filter(function(conn, i) {
            return (conn === ws) ? false : true;
        });

        logger.info(ws_connections.length + " connections are remaining");
    });
});
logger.info("websocket server created")


// broadcast websocket message
function broadcast(obj) {
    logger.info('broadcast');
    ws_connections.forEach(function(socket, i) {
        socket.send(JSON.stringify(obj));
    });
}

// send message to line user
function sendResponse(data) {
    var headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Line-ChannelID': '', // enter your Channel ID
        'X-Line-ChannelSecret': '', // enter your Channel Secret
        'X-Line-Trusted-User-With-ACL': '' // enter your MID
    };

    var options = {
        url: 'https://trialbot-api.line.me/v1/events',
        // proxy: process.env.FIXIE_URL,
        headers: headers,
        json: true,
        body: data
    };
    logger.info('--- post data ---')
    logger.info(data)

    httpRequest.post(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            logger.info(body);
        } else {
            logger.info('error: ' + JSON.stringify(response));
        }
    });

}
