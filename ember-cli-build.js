'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  let app = new EmberAddon(defaults, {
    // Add options here
  });

  app.import('bower_components/pusher/dist/web/pusher.js');
  app.import('bower_components/action-cable/dist/action_cable.js');

  if (app.env === 'test') {
    app.import('bower_components/pusher-test-stub/build/bin/pusher-test-stub.js');
  }

  return app.toTree();
};
