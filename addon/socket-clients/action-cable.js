import { assert } from '@ember/debug';
import EmberObject, {
  setProperties,
  getProperties,
  get,
  set
} from '@ember/object';

export default EmberObject.extend({
  actionCableService: ActionCable,
  actionCable: null,
  eventHandler: null,
  joinedChannels: null,
  hasNoChannels: true,

  setup(config, eventHandler) {
    assert(
      '[ember-sockets-guru] You need to provide socketAddress in config in the socket-guru service',
      !!get(config, 'socketAddress')
    );
    assert(
      '[ember-sockets-guru] You need to provide eventHandler in the socket-guru service',
      typeof eventHandler === 'function'
    );

    const socketAddress = get(config, 'socketAddress');
    const actionCable = this.actionCableService.createConsumer(socketAddress);
    setProperties(this, { actionCable, eventHandler, joinedChannels: {} });
  },

  subscribe(channels) {
    const {
      actionCable, eventHandler, joinedChannels,
    } = getProperties(this, 'actionCable', 'eventHandler', 'joinedChannels');
    const newChannels = Object.assign({}, joinedChannels);

    channels.forEach((channel) => {
      newChannels[channel] = actionCable.subscriptions.create(channel, {
        initialized() {
          eventHandler('initialized');
        },
        connected() {
          eventHandler('connected');
        },
        rejected() {
          eventHandler('rejected');
        },
        received(data) {
          eventHandler('received', data);
        },
      });
    });

    set(this, 'joinedChannels', newChannels);
  },

  emit(channelName, data) {
    const joinedChannel = get(this, `joinedChannels.${channelName}`);
    if (joinedChannel) {
      joinedChannel.send(data);
    } else {
      assert(
      '[ember-sockets-guru] You were trying to emit message to unsubscribed channel',
      false
    );
    }
  },

  unsubscribeChannels(channels) {
    const joinedChannels = this.joinedChannels;

    channels.forEach((channel) => {
      const selectedChannel = joinedChannels[channel];

      if (selectedChannel) {
        const newJoinedChannels = Object.assign({}, joinedChannels);

        selectedChannel.unsubscribe();
        delete newJoinedChannels[channel];
        set(this, 'joinedChannels', newJoinedChannels);
      }
    });
  },

  disconnect() {
    this.actionCable.disconnect();
  },
});
