import EmberObject, {
  setProperties,
  set,
  get
} from '@ember/object';
import { run } from '@ember/runloop';
import { warn, assert } from '@ember/debug';
import { Socket } from 'phoenix';

export default EmberObject.extend({
  Socket,
  joinedChannels: {},

  setup(config, eventHandler) {
    this._checkConfig(config);
    const SocketService = this.Socket;
    const socket = new SocketService(get(config, 'socketAddress'));
    socket.connect();
    setProperties(this, { socket, eventHandler });
  },

  subscribe(observedChannels) {
    Object.keys(observedChannels).forEach((channelName) => {
      const channel = this.socket.channel(channelName);
      const joinedChannels = this.joinedChannels;
      channel.join();
      set(this, 'joinedChannels', Object.assign({}, joinedChannels, {
        [channelName]: channel,
      }));
      this._attachEventsToChannel(channel, channelName, observedChannels[channelName]);
    });
  },

  unsubscribeChannels(channelsToUnsubscribe) {
    Object.keys(channelsToUnsubscribe)
      .forEach(channel => get(this, `joinedChannels.${channel}`).leave());
  },

  emit(channelName, eventName, eventData) {
    const channel = get(this, `joinedChannels.${channelName}`);
    if (!channel) {
      return warn(
        `[ember-socket-guru] You need to join channel ${channelName} before pushing events!`,
        channel,
        { id: 'ember-socket-guru.channel-not-joined' }
      );
    }
    channel.push(eventName, eventData);
  },

  disconnect() {
    this.socket.disconnect();
  },

  _checkConfig(config) {
    assert(
      '[ember-sockets-guru] You need to provide socketAddress in the socket-guru service',
      !!get(config, 'socketAddress')
    );
  },

  _attachEventsToChannel(channel, channelName, events) {
    events.forEach((event) => {
      channel.on(event, (data) => {
        run(() => this.eventHandler(event, data));
      });
    });
  },
});
