var http = require('http'),
    express = require('express'),
    path = require('path'),
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    CollectionDriver = require('./collectionDriver').CollectionDriver,
    twitter = require('ntwitter');

var credentials = require('./credentials.js');
 
var t = new twitter({
    consumer_key: credentials.consumer_key,
    consumer_secret: credentials.consumer_secret,
    access_token_key: credentials.access_token_key,
    access_token_secret: credentials.access_token_secret
});
 
var app = express();
app.set('port', process.env.PORT || 3000); 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.bodyParser());

var mongoHost = 'localhost';
var mongoPort = 27017; 
var collectionDriver;
 
var mongoClient = new MongoClient(new Server(mongoHost, mongoPort));
mongoClient.open(function(err, mongoClient) {
    if (!mongoClient) {
        console.error("Error! Exiting... Must start MongoDB first");
        process.exit(1);
    }
    var db = mongoClient.db("twitterstream");
    collectionDriver = new CollectionDriver(db);
});

var vancouver = [ '-123.324449', '49.001904', '-122.545879', '49.421868' ]

t.stream(
  'statuses/filter',
  { locations: vancouver },
  function(stream) {
    stream.on('data', function(data) {
        if (data.text.indexOf("bubblegum") != -1) {
            collectionDriver.save('tweets', data, function(error, docs) {
                if (error) { 
                    console.log("Tweet did not insert");
                } else { 
                    console.log("Inserted tweet")
                }
            });
        }
  });
});

app.use(express.static(path.join(__dirname, 'public')));
 
app.get('/', function (req, res) {
  res.send('<html><body><h1>Use /tweets?offset=0&limit=10 to get tweets.</h1></body></html>');
});
 
app.get('/tweets', function(req, res) {
    var query = require('url').parse(req.url,true).query;
    var offset = parseInt(query.offset);
    var limit = parseInt(query.limit);
    if(query.query) {
        var search = query.query;
    }

    collectionDriver.findAll('tweets', offset, limit, search, function(error, objs) {
        if (error) { 
            res.send(400, error);
        } else { 
            if (req.accepts('html')) {
                res.render('data',{objects: objs, collection: req.params.collection});
            } else {
                res.set('Content-Type','application/json');
                res.send(200, objs);
            }
        }
    });
});
 
app.use(function (req,res) {
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});