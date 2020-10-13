var fs = require('fs')
var express = require('express');
var app = express();
var compression = require('compression')
var downloader = require('./helper/solcDownloader');

var bluebird = require("bluebird");

var smartContractRouter = require("./routes/smartContractRouter")
var cors = require('cors');

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;
var configFileName = 'config.cfg';
//------------------------------------------------------------------------------
//  Start from here
//------------------------------------------------------------------------------

main();

//------------------------------------------------------------------------------
//  All the implementation goes below
//------------------------------------------------------------------------------

function main() {
  console.log('Loading config file: ' + configFileName);
  try {
    config = JSON.parse(fs.readFileSync(configFileName));
  } catch (err) {
    console.log('Error: unable to load ' + configFileName);
    console.log(err);
    process.exit(1);
  }
  console.log(config);

  var privateKey = fs.readFileSync(config.cert.key, 'utf8');
  var certificate = fs.readFileSync(config.cert.crt, 'utf8');
  var options = {
    key: privateKey,
    cert: certificate
  };
  app.use(cors());
  app.use(compression());

  app.get('/ping', function (req, res) {
    console.log('Receive healthcheck /ping from ELB - ' + req.connection.remoteAddress);
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Length': 2
    });
    res.write('OK');
    res.end();
  });


  var http = require('http').createServer(app);
  http.listen(config.server.port, () => {
    console.log("rest api running on port.", config.server.port);
  });

  // REST services
  // smart contract router
  smartContractRouter(app);


  // downloader.downloadByVersion('0.7.1').then(res => {
  //   console.log('res:', res)
  // }).catch(e => {
  //   console.log('Error in after downloadByVersion catch:', e)
  // })
  // downloader.downloadAll('./libs');
}