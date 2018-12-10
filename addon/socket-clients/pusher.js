import EmberObject, {
  setProperties,
  set,
  get
} from '@ember/object';
import $ from 'jquery';
import { run } from '@ember/runloop';
import { warn, assert } from '@ember/debug';
import { omit } from 'lodash';

export default EmberObject.extend({
  pusherService: Pusher,
  socketId: null,
  socket: null,
  eventHandler: null,
  requiredConfigurationOptions: ['pusherKey'],
  joinedChannels: {},

  setup(config, eventHandler) {
    const PusherService = get(this, 'pusherService');
    this._checkConfig(config);
    setProperties(this, {
      eventHandler,
      socket: new PusherService(
        get(config, 'pusherKey'),
        omit(config, get(this, 'requiredConfigurationOptions'))
      ),
    });

    get(this, 'socket').connection
      .bind('connected', () => this._handleConnected());
  },

  subscribe(observedChannels) {
    Object.keys(observedChannels).forEach((channelName) => {
      const channel = get(this, 'socket').subscribe(channelName);
      const joinedChannels = get(this, 'joinedChannels');
      set(this, 'joinedChannels', Object.assign({}, joinedChannels, {
        [channelName]: channel,
      }));
      this._attachEventsToChannel(channel, channelName, observedChannels[channelName]);
    });
  },

  unsubscribeChannels(observedChannels) {
    Object.keys(observedChannels)
      .forEach(channel => get(this, 'socket').unsubscribe(channel));
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
    channel.trigger(eventName, eventData);
  },

  disconnect() {
    if (get(this, 'socket.disconnect')) {
      get(this, 'socket').disconnect();
    }
  },

  _handleConnected() {
    const socketId = get(this, 'socket').connection.socket_id;
    set(this, 'socketId', socketId);
    $.ajaxPrefilter((options, originalOptions, xhr) => {
      return xhr.setRequestHeader('X-Pusher-Socket', socketId);
    });
  },

  _attachEventsToChannel(channel, channelName, events) {
    events.forEach((event) => {
      channel.bind(event, (data) => {
        run(() => get(this, 'eventHandler')(event, data));
      });
    });
  },

  _checkConfig(config) {
    assert(
      '[ember-sockets-guru] You need to provide pusher key in the socket-guru service',
      !config || !!get(config, 'pusherKey')
    );
    assert(
      '[ember-sockets-guru] You need to include the pusher library',
      !!window.Pusher
    );
  },
});
