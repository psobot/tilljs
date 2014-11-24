/*
 *  Interface with a [Till](http://github.com/psobot/till) cache server
 *  for storing files locally, on S3, on Rackspace Cloud Files, in Redis, etc.
 */

var Q = require('q');
var _ = require('lodash');
var request = require('q-io/http').request;

var gen_url = function(key) {
  return "/api/v1/object/" + key;
};

function TillClient(host, port) {
  //  Allow client code to call with or without the "new" operator.
  if (!(this instanceof TillClient)) {
    return new TillClient(host, port);
  }

  this.host = host || 'localhost';
  this.port = port || '5632';
}

/**
 * Asynchronously get a value from the tilld cache, if it exists.
 * If a file does not exist, null will be returned.
 * 
 * @param {String} key
 * @return {Promise[Either[String, null]]}
 */
TillClient.prototype.get = function(key) {
  var options = {
    method: 'GET',
    host: this.host,
    port: this.port,
    path: gen_url(key),
  };
  
  //  Check Till's output for errors.
  return request(options).then(function(res) {
    if (res.status === 200) {
      return res.body.read().then(function(bodyStream) {
          return bodyStream.toString('utf-8');
      });
    } else {
      return null;
    }
  }).catch(function(err) {
    return null;
  });
};

/**
 * Asynchronously save a value to the tilld cache.
 * If the cache directory does not exist, null will be returned.
 * 
 * @param {String} key
 * @param {String} value
 * @return {Promise[undefined]}
 */
TillClient.prototype.set = function(key, value) {
  var options = {
    method: 'POST',
    host: this.host,
    port: this.port,
    path: gen_url(key),
    body: [value],
    headers: {
      'X-Till-Lifespan': 'default',
      'Content-Length': Buffer.byteLength(value, 'utf8'),
    },
  };

  //  Check Till's output for errors.
  return request(options).catch(function(err) {
    return null;
  });
};

/**
 * Asynchronously check for the existence of
 * a value in the on-disk cache.
 * 
 * @param {String} key
 * @return {Promise[bool]}
 */
TillClient.prototype.exists = function(key) {
  //  TODO: Once Till supports HEAD queries, change this to a HEAD.
  return this.get(key).then(function(data) { return !!data; });
};

/**
 * Asynchronously check if the cache server is active.
 * 
 * @return {Promise[bool]}
 */
TillClient.prototype.isActive = function() {
  var options = {
    method: 'GET',
    host: this.host,
    port: this.port,
    path: gen_url(''),
  };
  
  return request(options).then(function(res) {
    if (res.status === 400) {
      return true;
    } else {
      return false;
    }
  }).catch(function(err) {
    return false;
  });
};

module.exports = TillClient;
