/**
 * @deprecated This mixin is deprecated in favor of base classes.
 *
 * Use `SocketEventHandlerRoute` instead:
 *
 * ```javascript
 * // Old (deprecated):
 * import SocketEventHandler from 'ember-socket-guru/mixins/socket-event-handler';
 * export default Route.extend(SocketEventHandler, { ... });
 *
 * // New (recommended):
 * import SocketEventHandlerRoute from 'ember-socket-guru/bases/socket-event-handler-route';
 * export default class MyRoute extends SocketEventHandlerRoute { ... }
 * ```
 *
 * This file is kept for backward compatibility but will be removed in a future version.
 */

import { deprecate } from '@ember/debug';
import Mixin from '@ember/object/mixin';
import { service } from '@ember/service';

export default Mixin.create({
  socketGuru: service(),

  init() {
    deprecate(
      'Using SocketEventHandler mixin is deprecated. Please use SocketEventHandlerRoute base class instead. See: https://github.com/netguru/ember-socket-guru#migration',
      false,
      {
        id: 'ember-socket-guru.socket-event-handler-mixin',
        until: '3.0.0',
        for: 'ember-socket-guru',
        since: {
          available: '2.0.0',
          enabled: '2.0.0',
        },
      }
    );

    this._super(...arguments);
    this._boundHandleEvent = this._handleEvent.bind(this);
    this.socketGuru.events.addEventListener('newEvent', this._boundHandleEvent);
  },

  willDestroy() {
    this._super(...arguments);
    this.socketGuru.events.removeEventListener('newEvent', this._boundHandleEvent);
  },

  _handleEvent(event) {
    const { eventName, data } = event.detail;
    const method = this._getEventMethod(eventName);

    if (method) {
      return method(data);
    }

    if (this.onSocketAction && typeof this.onSocketAction === 'function') {
      this.onSocketAction(eventName, data);
    }
  },

  _getEventMethod(methodName) {
    const socketActions = this.socketActions || {};

    if (socketActions[methodName]) {
      return socketActions[methodName].bind(this);
    }

    return null;
  },
});
