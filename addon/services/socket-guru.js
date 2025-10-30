import { assert } from '@ember/debug';
import Service from '@ember/service';
import { runInDebug } from '@ember/debug';

import SocketIOClient from 'ember-socket-guru/socket-clients/socketio';
import { verifyArrayStructure } from 'ember-socket-guru/util/structure-checker';
import { eventsDiff, removeEvent } from 'ember-socket-guru/util/events-diff';

export default class SocketGuruService extends Service {
  /**
   * Configuration for the Socket.IO client
   *
   * This object is passed to the Socket.IO client for connection setup.
   * Required properties: host, namespace
   * @type {Object}
   */
  config = null;

  /**
   * Socket.IO client instance
   * @type {Object}
   */
  client = null;

  /**
   * Determines whether service should connect to client on startup.
   * @type {Boolean}
   */
  autoConnect = true;

  /**
   * Array containing all events to observe.
   *
   * Socket.IO uses a flat array of event names (no channel concept).
   * @type {Array<String>}
   */
  observedChannels = null;

  /**
   * EventTarget for handling Socket.IO events
   * @type {EventTarget}
   */
  events = new EventTarget();

  constructor(properties) {
    super(...arguments);
    // Apply any properties passed to constructor (useful for tests)
    if (properties) {
      Object.assign(this, properties);
    }
    if (this.autoConnect) {
      this.setup();
    }
  }

  willDestroy() {
    super.willDestroy();
    if (this.client) {
      this.client.disconnect();
    }
  }

  /**
   * Sets up the Socket.IO client connection.
   *
   * Creates a Socket.IO client instance, configures it with the provided
   * config object, and subscribes to the observed events.
   */
  setup() {
    // Create Socket.IO client directly - fixes Embroider compatibility
    // Don't create a new client if one already exists (useful for tests)
    if (!this.client) {
      this.client = new SocketIOClient();
    }

    runInDebug(() => this._checkOptions());

    this.client.setup(
      this.config,
      this._handleEvent.bind(this)
    );
    this.client.subscribe(this.observedChannels);
  }

  /**
   * Adds new events to observe
   * @param {Array<String>} newObservedChannels - Array of event names to add
   */
  addObservedChannels(newObservedChannels) {
    const currentEvents = this.observedChannels;
    const updatedEvents = [...currentEvents, ...newObservedChannels];
    this._manageChannelsChange(currentEvents, updatedEvents);
  }

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
  }

  /**
   * Replaces all observed events with a new set
   * @param {Array<String>} newObservedChannels - New array of event names
   */
  updateObservedChannels(newObservedChannels) {
    this._manageChannelsChange(this.observedChannels, newObservedChannels);
  }

  /**
   * Emits an event to the Socket.IO server
   * @param {String} eventName - Name of the event to emit
   * @param {*} eventData - Data to send with the event
   */
  emit(eventName, eventData) {
    this.client.emit(eventName, eventData);
  }

  _manageChannelsChange(oldEvents, newEvents) {
    const {
      channelsToSubscribe,
      channelsToUnsubscribe,
    } = eventsDiff(oldEvents, newEvents);

    this.client.subscribe(channelsToSubscribe);
    this.client.unsubscribeChannels(channelsToUnsubscribe);
  }

  _handleEvent(eventName, data) {
    // Dispatch custom event with eventName and data in detail
    const event = new CustomEvent('newEvent', {
      detail: { eventName, data }
    });
    this.events.dispatchEvent(event);
  }

  _checkOptions() {
    const observedChannels = this.observedChannels;

    assert('[ember-socket-guru] You must provide observed events', !!observedChannels);
    this._checkStructure();
  }

  _checkStructure() {
    const observedChannels = this.observedChannels;

    assert(
      '[ember-socket-guru] observedChannels must be an array of event name strings',
      Array.isArray(observedChannels) && verifyArrayStructure(observedChannels)
    );
  }
}
