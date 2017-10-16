import Ember from 'ember';
import { omit } from 'lodash';

const {
  get,
  assert,
  getProperties,
  setProperties,
  getWithDefault,
} = Ember;

export default Ember.Object.extend({
  ioService: io,
  hasNoChannels: true,
  requiredConfigurationOptions: ['host'],
  // There's no concept of unsubscribing channels in socket.io
  unsubscribeChannels() {},

  setup(config, eventHandler) {
    this._checkConfig(config);
    const socket = get(this, 'ioService')(
      get(config, 'host'),
      omit(config, get(this, 'requiredConfigurationOptions'))
    );
    setProperties(this, { socket, eventHandler });
    socket.connect();
  },

  subscribe(observedChannels) {
    const { socket, eventHandler } = getProperties(this, 'socket', 'eventHandler');
    observedChannels.forEach(eventName => socket.on(eventName, function(data){eventHandler(eventName,data)}));
  },
  
  emit(eventName, eventData) {
    const socket = get(this, 'socket');
    socket.emit(eventName, eventData);
  },

  disconnect() {
    get(this, 'socket').disconnect();
  },

  _checkConfig(config) {
    assert(
      '[ember-sockets-guru] You need to provide host in the socket-guru service',
      !!get(config, 'host')
    );
    assert(
      `
      [ember-sockets-guru] You need to make sure the socket.io client library
      is available on the global window object
      `,
      !!get(this, 'ioService')
    );
  },
});
