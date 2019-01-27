var fs = require('fs'),
    express = require('express'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    morgan = require('morgan'),
    compress = require('compression'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    helmet = require('helmet'),
    flash = require('connect-flash'),
    consolidate = require('consolidate'),
    multipart = require('connect-multiparty')

var app = express();

const UPLOADS_DIR = "./uploads";

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

app.use(compress({
    filter: function(req, res) {
        return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
    },
    level: 9
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser());
app.use(flash());
app.use(morgan('dev'));
app.use(helmet.frameguard());
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());
app.use(helmet.hsts({
    includeSubdomains: true,
    force: true
}));
app.use(multipart({
    uploadDir: UPLOADS_DIR
}));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});
app.disable('x-powered-by');
app.set('port', 8080);

const requestIp = require('request-ip');
app.use(requestIp.mw());

const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

app.use('/app', express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
    res.send("OK");
});

try {
    var ssl_options = {
        key: fs.readFileSync('./ssl/privkey.pem'),
        cert: fs.readFileSync('./ssl/fullchain.pem')
    };
    var secureServer = https.createServer(ssl_options, app).listen(app.get('port'), () => {
        console.log(">> Express HTTPS server listening at port " + app.get('port'));
    });
} catch (e) {
    var server = http.createServer(app).listen(app.get('port'), function() {
        console.log("Express HTTP server listening on port " + app.get('port'));
    });
}