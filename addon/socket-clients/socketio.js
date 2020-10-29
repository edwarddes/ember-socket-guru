import { assert } from '@ember/debug';
import EmberObject, {
  getWithDefault,
  setProperties,
  getProperties,
  get
} from '@ember/object';
import { omit } from 'lodash';
import io from 'socket.io-client';

export default EmberObject.extend({
  hasNoChannels: true,
  requiredConfigurationOptions: ['host','namespace'],
  // There's no concept of unsubscribing channels in socket.io
  unsubscribeChannels() {},

  setup(config, eventHandler) {
    this._checkConfig(config);
    const socket = io(
      get(config, 'host'),
	  {
		path:get(config,'namespace')+'/socket.io'
	  }
    );
    setProperties(this, { socket, eventHandler });
    socket.connect();
  },

  subscribe(observedChannels) {
    const { socket, eventHandler } = getProperties(this, 'socket', 'eventHandler');
    observedChannels.forEach(eventName => socket.on(eventName, function(data){eventHandler(eventName,data)}));
  },
  
  emit(eventName, eventData) {
    const socket = this.socket;
    socket.emit(eventName, eventData);
  },

  disconnect() {
    this.socket.disconnect();
  },

  _checkConfig(config) {
    assert(
      '[ember-sockets-guru] You need to provide host in the socket-guru service',
      !!get(config, 'host')
    );
    assert(
      '[ember-sockets-guru] You need to provide namespace in the socket-guru service',
      get(config, 'namespace')!=undefined
    );
  },
});
