import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

/* eslint-disable array-callback-return */
Router.map(function() {
  this.route('technology', { path: '/:technology' }, function() {
    this.route('installation');
    this.route('getting-started');
    this.route('observed-channels-structure');
    this.route('socket-clients');
  });
});
