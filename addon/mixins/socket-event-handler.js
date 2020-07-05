import { get } from '@ember/object';
import Mixin from '@ember/object/mixin';
import { inject } from '@ember/service';

export default Mixin.create({
  socketGuru: inject(),

  init() {
    this._super(...arguments);
    this.socketGuru.on('newEvent', this, this._handleEvent);
  },

  willDestroy() {
    this._super(...arguments);
    this.socketGuru.off('newEvent', this, this._handleEvent);
  },

  _handleEvent(event, data) {
    const method = this._getEventMethod(event);
    if (method) return method(data);
    if (this.onSocketAction && this.onSocketAction.constructor === Function) {
      this.onSocketAction(event, data);
    }
  },

  _getEventMethod(methodName) {
    const socketActions = this.socketActions || [];
    const method = Object.keys(socketActions)
      .find((key) => key === methodName);
    if (method) {
      return get(this, `socketActions.${methodName}`).bind(this);
    }
  },
});
