import { assert } from '@ember/debug';
import io from 'socket.io-client';

export default class SocketIOClient {
  hasNoChannels = true;
  requiredConfigurationOptions = ['host', 'namespace'];

  socket = null;
  eventHandler = null;

  // There's no concept of unsubscribing channels in socket.io
  unsubscribeChannels() {}

  // Method to get io function (allows stubbing in tests)
  _getIo() {
    return io;
  }

  setup(config, eventHandler) {
    this._checkConfig(config);
    const ioFn = this._getIo();
    const socket = ioFn(
      config.host,
      {
        path: config.namespace + '/socket.io'
      }
    );
    this.socket = socket;
    this.eventHandler = eventHandler;
    socket.connect();
  }

  subscribe(observedChannels) {
    const { socket, eventHandler } = this;
    observedChannels.forEach(eventName => {
      socket.on(eventName, function(data) {
        eventHandler(eventName, data);
      });
    });
  }

  emit(eventName, eventData) {
    this.socket.emit(eventName, eventData);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  _checkConfig(config) {
    assert(
      '[ember-socket-guru] You need to provide host in the socket-guru service',
      !!config.host
    );
    assert(
      '[ember-socket-guru] You need to provide namespace in the socket-guru service',
      config.namespace !== undefined
    );
  }
}
