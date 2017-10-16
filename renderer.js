const fs = require('fs');

// load the cache manifest
const path = require('path');

const deps = ['build/bundles/renderer.bundle.js'];

const _ = require('lodash');
const React = require('react');
const ReactDOM = require('react-dom');
const protobuf = require('protobufjs');

const ReactDOMServer = require('react-dom/server');
global.ReactDOMServer = ReactDOMServer;

let factories = {};

function loadViews() {
  global.__VIEWS__ = {};
  global.window = global;

  for (let fp of deps) {
    // load the renderer components code
    let code;
    try {
      code = fs.readFileSync(fp);
    } catch (err) {
      console.error(`Error loading ${fp}`);
      console.error(err);
      process.exit(1);
    }
    try {
      eval(code.toString());
    } catch (e) {
      console.log(e);
      return;
    }
  }
  console.log('loaded');

  for (key in global.__VIEWS__) {
    factories[key] = React.createFactory(global.__VIEWS__[key]);
  }
}

loadViews();

const qs = require('querystring');
const http = require('http');

let server = http.createServer((req, res) => {
  let body = '';

  req.on('data', function(data) {
    body += data;
  });

  req.on('end', function() {
    loadViews();

    let data = qs.parse(body);

    let start = new Date().valueOf();

    if (data.view === undefined) {
      res.writeHead(400);
      res.end('Need component field');
      return;
    }

    let factory = factories[data.view];
    let props = {};
    if (data.props !== undefined) {
      props = JSON.parse(data.props);
    }

    if (factory === undefined) {
      res.writeHead(404);
      res.end('View not found: ' + data.view);
      return;
    }

    try {
      // FIXME: this is the right thing to do
      let string = ReactDOMServer.renderToString(factory(props));
      res.writeHead(200);
      res.end(string);
      let end = new Date().valueOf();
      console.log('Render time', data.component, end - start + 'ms');
    } catch (e) {
      console.log(e);
      res.writeHead(500);
      res.end(e.message);
      return;
    }
    res.end();
  });
});

server.listen('8111', function() {
  console.log('Listening on :8111');
});
