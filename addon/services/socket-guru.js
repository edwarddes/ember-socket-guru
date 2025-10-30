import { assert } from '@ember/debug';
import Service from '@ember/service';
import { runInDebug } from '@ember/debug';
import { set } from '@ember/object';
import Evented from '@ember/object/evented';

import SocketIOClient from 'ember-socket-guru/socket-clients/socketio';
import { verifyArrayStructure } from 'ember-socket-guru/util/structure-checker';
import { eventsDiff, removeEvent } from 'ember-socket-guru/util/events-diff';

export default Service.extend(Evented, {
  /**
   * Configuration for the Socket.IO client
   *
   * This object is passed to the Socket.IO client for connection setup.
   * Required properties: host, namespace
   * @param config
   * @type {Object}
   */
  config: null,

  /**
   * Socket.IO client instance
   * @param client
   * @type {Object}
   */
  client: null,

  /**
   * Determines whether service should connect to client on startup.
   * @param autoConnect
   * @type {Boolean}
   */
  autoConnect: true,

  /**
   * Array containing all events to observe.
   *
   * Socket.IO uses a flat array of event names (no channel concept).
   * @param observedChannels
   * @type {Array[String]}
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
   * Sets up the Socket.IO client connection.
   *
   * Creates a Socket.IO client instance, configures it with the provided
   * config object, and subscribes to the observed events.
   */
  setup() {
    // Create Socket.IO client directly - fixes Embroider compatibility
    const socketClient = SocketIOClient.create();
    set(this, 'client', socketClient);

    runInDebug(() => this._checkOptions());

    this.client.setup(
      this.config,
      this._handleEvent.bind(this)
    );
    this.client.subscribe(this.observedChannels);
  },

  /**
   * Adds new events to observe
   * @param {Array[String]} newObservedChannels - Array of event names to add
   */
  addObservedChannels(newObservedChannels) {
    const currentEvents = this.observedChannels;
    const updatedEvents = [...currentEvents, ...newObservedChannels];
    this._manageChannelsChange(currentEvents, updatedEvents);
  },

  /**
   * Removes an observed event
   * @param {String} eventName - Event name to remove
   */
  removeObservedChannel(eventName) {
    const observed = this.observedChannels;
    this._manageChannelsChange(
      observed,
      removeEvent(observed, eventName)
    );
  },

  /**
   * Replaces all observed events with a new set
   * @param {Array[String]} newObservedChannels - New array of event names
   */
  updateObservedChannels(newObservedChannels) {
    this._manageChannelsChange(this.observedChannels, newObservedChannels);
  },

  /**
   * Emits an event to the Socket.IO server
   * @param {String} eventName - Name of the event to emit
   * @param {*} eventData - Data to send with the event
   */
  emit(eventName, eventData) {
    this.client.emit(eventName, eventData);
  },

  _manageChannelsChange(oldEvents, newEvents) {
    const {
      channelsToSubscribe,
      channelsToUnsubscribe,
    } = eventsDiff(oldEvents, newEvents);

    this.client.subscribe(channelsToSubscribe);
    this.client.unsubscribeChannels(channelsToUnsubscribe);
  },

  _handleEvent(event, data) {
    this.trigger('newEvent', event, data);
  },

  _checkOptions() {
    const observedChannels = this.observedChannels;

    assert('[ember-socket-guru] You must provide observed events', !!observedChannels);
    this._checkStructure();
  },

  _checkStructure() {
    const observedChannels = this.observedChannels;

    assert(
      '[ember-socket-guru] observedChannels must be an array of event name strings',
      Array.isArray(observedChannels) && verifyArrayStructure(observedChannels)
    );
  },
});
