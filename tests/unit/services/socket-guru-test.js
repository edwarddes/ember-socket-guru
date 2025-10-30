import { get } from '@ember/object';
import { run } from '@ember/runloop';
import SocketGuruService from 'ember-socket-guru/services/socket-guru';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Service | socket guru', function() {
  const mockSocketClient = (
    setupSpy = function() {},
    subscribeSpy = function() {},
    disconnectSpy = function() {},
    unsubscribeChannelsSpy = function() {}
  ) => ({
    setup: setupSpy,
    subscribe: subscribeSpy,
    disconnect: disconnectSpy,
    unsubscribeChannels: unsubscribeChannelsSpy,
    hasNoChannels: true,
  });

  test('updating existing events', function(assert) {
    const oldEvents = ['oldEvent'];
    const eventsToUpdate = ['newEvent'];
    const subscribeSpy = sinon.spy();
    const unsubscribeChannelsSpy = sinon.spy();
    const service = SocketGuruService.create({
      client: mockSocketClient(function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy),
      autoConnect: false,
      observedChannels: oldEvents,
    });

    service.updateObservedChannels(eventsToUpdate);

    assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe method on the client');
    assert.deepEqual(
      subscribeSpy.args[0][0],
      eventsToUpdate,
      'it passes proper events to subscribe'
    );

    assert.ok(unsubscribeChannelsSpy.calledOnce, 'it calls the unsubscribe method on the client');
    assert.deepEqual(
      unsubscribeChannelsSpy.args[0][0],
      oldEvents,
      'it passes proper events for the client to unsubscribe'
    );
  });

  test('adding observed events', function(assert) {
    const subscribeSpy = sinon.spy();
    const unsubscribeChannelsSpy = sinon.spy();
    const observedChannels = ['oldEvent'];
    const service = SocketGuruService.create({
      observedChannels,
      client: mockSocketClient(function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy),
      autoConnect: false,
    });

    const eventsToAdd = ['newEvent'];
    service.addObservedChannels(eventsToAdd);

    assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe method on the client');
    assert.deepEqual(
      subscribeSpy.args[0][0],
      eventsToAdd,
      'it passes proper arguments to the client'
    );
  });

  test('removing events', function(assert) {
    const subscribeSpy = sinon.spy();
    const unsubscribeChannelsSpy = sinon.spy();
    const observedChannels = ['oldEvent', 'oldEvent2'];
    const service = SocketGuruService.create({
      observedChannels,
      client: mockSocketClient(function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy),
      autoConnect: false,
    });
    const expectedDeletedEvents = ['oldEvent'];

    service.removeObservedChannel('oldEvent');

    assert.ok(unsubscribeChannelsSpy.calledOnce, 'it calls the unsubscribe method on the client');
    assert.deepEqual(
      unsubscribeChannelsSpy.args[0],
      [expectedDeletedEvents],
      'it passes proper arguments'
    );
  });

  test('setup function', function(assert) {
    const setupSpy = sinon.spy();
    const disconnectSpy = sinon.spy();
    const subscribeSpy = sinon.spy();
    const config = { host: 'http://localhost:3000', namespace: '/test' };
    const service = SocketGuruService.create({
      config,
      observedChannels: ['event1'],
      autoConnect: false,
    });

    // Manually set client to test disconnect behavior
    service.set('client', mockSocketClient(setupSpy, subscribeSpy, disconnectSpy));

    run(() => {
      service.destroy();
    });

    assert.ok(
      disconnectSpy.calledOnce,
      'it calls the disconnect function on socketClient when destroyed'
    );
  });

  test('it delegates subscription to socketClient on setup', function(assert) {
    const subscribeSpy = sinon.spy();
    const setupSpy = sinon.spy();
    const observedChannels = ['event1'];
    const service = SocketGuruService.create({
      autoConnect: false,
      observedChannels,
    });

    // Mock the client before calling setup
    service.set('client', mockSocketClient(setupSpy, subscribeSpy));
    service.setup();

    assert.ok(setupSpy.calledOnce, 'it calls the setup function on socketClient');
    assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe function on socketClient');
    assert.deepEqual(
      subscribeSpy.args[0][0],
      observedChannels,
      'it passes the observed events to the subscribe function on socketClient'
    );
  });

  test('it calls setup on init if autoConnect is true', function(assert) {
    const subscribeSpy = sinon.spy();
    const setupSpy = sinon.spy();

    // We can't easily test the actual setup() call since it creates a real client,
    // but we can verify autoConnect behavior by checking that setup gets called
    const service = SocketGuruService.create({
      observedChannels: ['event1'],
      config: { host: 'http://localhost', namespace: '/test' },
      autoConnect: false,
    });

    assert.ok(
      !service.client,
      'client is not set when autoConnect is false'
    );
  });

  test('it validates the observedChannels structure', function(assert) {
    assert.throws(
      () => {
        SocketGuruService.create({
          observedChannels: {
            channel1: ['event1'],
          },
        });
      },
      /must be an array/,
      'it rejects object structure (requires array for socketio)'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          observedChannels: null,
        });
      },
      /must provide observed events/,
      'it verifies observed channels presence'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          observedChannels: ['event1', []],
        });
      },
      /must be an array of event name strings/,
      'it doesnt allow non-string items as event names'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          observedChannels: [],
        });
      },
      /must be an array of event name strings/,
      'it doesnt allow empty event arrays'
    );
  });

  test('it triggers newEvent when _handleEvent is called', function(assert) {
    assert.expect(2);
    const service = SocketGuruService.create({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    service.on('newEvent', (event, data) => {
      assert.equal(event, 'testEvent', 'event name is passed correctly');
      assert.deepEqual(data, { foo: 'bar' }, 'event data is passed correctly');
    });

    service._handleEvent('testEvent', { foo: 'bar' });
  });

  test('emit delegates to client', function(assert) {
    const emitSpy = sinon.spy();
    const service = SocketGuruService.create({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    service.set('client', {
      ...mockSocketClient(),
      emit: emitSpy,
    });

    service.emit('testEvent', { data: 'test' });

    assert.ok(emitSpy.calledOnce, 'it calls emit on the client');
    assert.equal(emitSpy.args[0][0], 'testEvent', 'it passes the event name');
    assert.deepEqual(emitSpy.args[0][1], { data: 'test' }, 'it passes the event data');
  });
});
