import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import SocketEventHandlerMixin from 'ember-socket-guru/mixins/socket-event-handler';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Mixin | socket event handler (deprecated)', function() {
  const socketGuruServiceStub = (removeEventListenerSpy = function() {}) => ({
    events: new EventTarget(),
    _removeListener: removeEventListenerSpy,
  });

  test('_handleEvent method', function(assert) {
    const funcSpy = sinon.spy();
    const mockSocketGuru = socketGuruServiceStub();

    const SocketEventHandlerObject = EmberObject.extend(SocketEventHandlerMixin, {
      socketGuru: mockSocketGuru,
      socketActions: {
        event1: funcSpy,
      },
    });
    const subject = SocketEventHandlerObject.create();

    const event = new CustomEvent('newEvent', {
      detail: { eventName: 'event1', data: { foo: 'bar' } }
    });

    subject._handleEvent(event);

    assert.ok(funcSpy.calledOnce, 'handler method is called');
    assert.ok(funcSpy.calledOn(subject), 'handler method is called with proper context');
  });

  test('it detaches events when object destroyed', function(assert) {
    const removeEventListenerSpy = sinon.spy();
    const mockSocketGuru = {
      events: {
        addEventListener: sinon.spy(),
        removeEventListener: removeEventListenerSpy,
      },
    };

    const SocketEventHandlerObject = EmberObject.extend(SocketEventHandlerMixin, {
      socketGuru: mockSocketGuru,
    });
    const subject = SocketEventHandlerObject.create();

    run(() => {
      subject.destroy();
    });

    assert.ok(removeEventListenerSpy.calledOnce, 'it calls removeEventListener on destroy');
  });

  test('it doesnt blow up when no actions and no eventHandler specified', function(assert) {
    const mockSocketGuru = socketGuruServiceStub();

    const SocketEventHandlerObject = EmberObject.extend(SocketEventHandlerMixin, {
      socketGuru: mockSocketGuru,
    });
    const subject = SocketEventHandlerObject.create();

    const event = new CustomEvent('newEvent', {
      detail: { eventName: 'event1', data: { foo: 'bar' } }
    });

    subject._handleEvent(event);

    assert.ok(true, 'it does not raise any exceptions');
  });
});
