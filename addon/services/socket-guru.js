import { assert } from '@ember/debug';
import Service from '@ember/service';
import { isArray } from '@ember/array';
import { runInDebug } from '@ember/debug';
import { getOwner } from '@ember/application';
import { get } from '@ember/object';
import { getProperties } from '@ember/object';
import { set } from '@ember/object';
import Evented from '@ember/object/evented';

import socketClientLookup from 'ember-socket-guru/util/socket-client-lookup';
import {
  verifyArrayStructure,
  verifyObjectStructure,
} from 'ember-socket-guru/util/structure-checker';
import { channelsDiff, removeChannel } from 'ember-socket-guru/util/channels-diff';
import { eventsDiff, removeEvent } from 'ember-socket-guru/util/events-diff';

export default Service.extend(Evented, {
  socketClientLookup,

  /**
   * Configuration for given client
   *
   * After the actual socketClient is resolved this object is then passed into it
   * which allows additional configuration.
   * @param config
   * @type {Object}
   */
  config: null,

  /**
   * Socket client name, that will be used to resolve the actual socketClient.
   * @param socketClient
   * @type {String}
   */
  socketClient: null,

  /**
   * Socket client instance resolved using name.
   * @param client
   * @type {Object}
   */
  client: null,

  /**
   * Determines whether service should connect to client on startup.
   * @param autConnect
   * @type {Boolean}
   */
  autoConnect: true,

  /**
   * Array containing all channels and events.
   *
   * Array containing objects, where the key name is the channel name
   * and the value a list of observed events
   * @param observedChannels
   * @type {Array[Object]}
   */
  observedChannels: null,

  init() {
    this._super(...arguments);
    if (this.autoConnect) {
      this.setup();
    }
  },

  willDestroy() {
    this._super(...arguments);
    const client = this.client;
    if (client) client.disconnect();
  },

  /**
   * Deals with instrumentation of the socketClient.
   *
   * Looks up the socketClient using it's string name and calls it's `setup` method
   * passing in the config object
   */
  setup() {
    const socketClient = this.socketClientLookup(getOwner(this), this.socketClient);
    set(this, 'client', socketClient);
    runInDebug(() => this._checkOptions());
    this.client.setup(
      this.config,
      this._handleEvent.bind(this)
    );
    this.client.subscribe(this.observedChannels);
  },

  addObservedChannels(newObservedChannels) {
    const channelData = this.observedChannels;
    const updatedChannelsData = this._hasNoChannels()
      ? [...channelData, ...newObservedChannels]
      : { ...channelData, ...newObservedChannels };
    this._manageChannelsChange(channelData, updatedChannelsData);
  },

  removeObservedChannel(channelName) {
    const observed = this.observedChannels;
    const removeFunc = this._hasNoChannels() ? removeEvent : removeChannel;
    this._manageChannelsChange(
      observed,
      removeFunc(observed, channelName)
    );
  },

  updateObservedChannels(newObservedChannels) {
    this._manageChannelsChange(this.observedChannels, newObservedChannels);
  },

  emit(eventName, eventData) {
    this.client.emit(eventName, eventData);
  },

  _manageChannelsChange(oldChannelsData, newChannelsData) {
    const diffFunction = this._hasNoChannels() ? eventsDiff : channelsDiff;
    const {
      channelsToSubscribe,
      channelsToUnsubscribe,
    } = diffFunction(oldChannelsData, newChannelsData);

    this.client.subscribe(channelsToSubscribe);
    this.client.unsubscribeChannels(channelsToUnsubscribe);
  },

  _handleEvent(event, data) {
    this.trigger('newEvent', event, data);
  },

  _checkOptions() {
    const {
      observedChannels,
      socketClient,
    } = getProperties(this, 'observedChannels', 'socketClient');

    assert('[ember-socket-guru] You must provide observed channels/events', !!observedChannels);
    this._checkStructure();
    assert(
      '[ember-socket-guru] You must provide socketClient property for socket-guru service.',
      !!socketClient
    );
  },

  _checkStructure() {
    const observedChannels = this.observedChannels;

    if (!isArray(observedChannels)) {
      assert(
        '[ember-socket-guru] observedChannels property must have correct structure.',
        !this._hasNoChannels() && verifyObjectStructure(observedChannels)
      );
    } else {
      assert(
        '[ember-socket-guru] observedChannels must have correct structure (array of events)',
        this._hasNoChannels() && verifyArrayStructure(observedChannels)
      );
    }
  },

  _hasNoChannels() {
    return !!get(this, 'client.hasNoChannels');
  },
});
