'use strict';

const BabelTranspiler = require('broccoli-babel-transpiler');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const path = require('path');

const vendorFiles = {
  pusher: 'bower_components/pusher/dist/web/pusher.js',
  socketio: 'bower_components/socket.io-client/dist/socket.io.js',
  phoenix: 'vendor/modules/phoenix.js',
  'action-cable': 'bower_components/action-cable/dist/action_cable.js',
};

const defaultInclude = ['pusher', 'socketio', 'phoenix', 'action-cable'];

module.exports = {
  name: require('./package').name
};
