import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import SocketEventHandlerMixin from 'ember-socket-guru/mixins/socket-event-handler';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Mixin | socket event handler');

const socketGuruServiceStub = (offSpy = function() {}) => ({
  on() {},
  off: offSpy,
});

test('_handleEvent method', function(assert) {
  const funcSpy = sinon.spy();
  const SocketEventHandlerObject = EmberObject.extend(SocketEventHandlerMixin, {
    socketGuru: socketGuruServiceStub(),
    socketActions: {
      event1: funcSpy,
    },
  });
  const subject = SocketEventHandlerObject.create();
  subject._handleEvent('event1', { foo: 'bar' });

  assert.ok(funcSpy.calledOnce, 'handler method is called');
  assert.ok(funcSpy.calledOn(subject), 'handler method is called with proper context');
});

test('it detaches events when object destroyed', function(assert) {
  const offSpy = sinon.spy();
  const SocketEventHandlerObject = EmberObject.extend(SocketEventHandlerMixin, {
    socketGuru: socketGuruServiceStub(offSpy),
  });
  const subject = SocketEventHandlerObject.create();

  run(() => {
    subject.destroy();
  });

  assert.ok(offSpy.calledOnce, 'it calls Ember.Eventeds off method on destroy');
});

test('it doesnt blow up when no actions and no eventHandler specified', function(assert) {
  const offSpy = sinon.spy();
  const SocketEventHandlerObject = EmberObject.extend(SocketEventHandlerMixin, {
    socketGuru: socketGuruServiceStub(offSpy),
  });
  const subject = SocketEventHandlerObject.create();
  subject._handleEvent('event1', { foo: 'bar' });

  assert.ok(true, 'it does not raise any exceptions');
});
