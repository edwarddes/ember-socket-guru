import Route from '@ember/routing/route';
import { service } from '@ember/service';

/**
 * Base class for routes that need to handle Socket.IO events.
 *
 * This class provides automatic event handling for Socket.IO events.
 * Extend this class and define `socketActions` to handle specific events.
 *
 * @example
 * ```javascript
 * import SocketEventHandlerRoute from 'ember-socket-guru/bases/socket-event-handler-route';
 *
 * export default class MyRoute extends SocketEventHandlerRoute {
 *   socketActions = {
 *     message(data) {
 *       console.log('Received message:', data);
 *     },
 *     notification(data) {
 *       console.log('Received notification:', data);
 *     }
 *   };
 *
 *   // Or use onSocketAction for catch-all handling
 *   onSocketAction(eventName, data) {
 *     console.log(`Received ${eventName}:`, data);
 *   }
 * }
 * ```
 */
export default class SocketEventHandlerRoute extends Route {
  @service socketGuru;

  /**
   * Object mapping event names to handler functions.
   * Define this in your subclass to handle specific events.
   * @type {Object}
   */
  socketActions = null;

  /**
   * Callback function for handling all socket events.
   * Define this in your subclass for catch-all event handling.
   * @type {Function}
   */
  onSocketAction = null;

  constructor() {
    super(...arguments);
    // Bind the event handler to maintain context
    this._boundHandleEvent = this._handleEvent.bind(this);
    this._listenersSetup = false;
  }

  // Override activate to set up listeners when route becomes active
  activate() {
    super.activate();
    this._ensureListenersSetup();
  }

  _ensureListenersSetup() {
    if (!this._listenersSetup && this.socketGuru && this.socketGuru.events) {
      this.socketGuru.events.addEventListener('newEvent', this._boundHandleEvent);
      this._listenersSetup = true;
    }
  }

  setupSocketListeners() {
    // Public method to set up listeners (useful for tests)
    this._ensureListenersSetup();
  }

  willDestroy() {
    super.willDestroy();
    if (this.socketGuru && this.socketGuru.events && this._boundHandleEvent) {
      this.socketGuru.events.removeEventListener('newEvent', this._boundHandleEvent);
    }
  }

  _handleEvent(event) {
    const { eventName, data } = event.detail;
    const method = this._getEventMethod(eventName);

    if (method) {
      return method(data);
    }

    if (this.onSocketAction && typeof this.onSocketAction === 'function') {
      this.onSocketAction(eventName, data);
    }
  }

  _getEventMethod(methodName) {
    const socketActions = this.socketActions || {};

    if (socketActions[methodName]) {
      return socketActions[methodName].bind(this);
    }

    return null;
  }
}
