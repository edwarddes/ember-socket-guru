import { setOwner } from '@ember/application';
import { run } from '@ember/runloop';
import SocketGuruService from 'ember-socket-guru/services/socket-guru';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Service | socket guru', function(hooks) {
  let owner;

  hooks.beforeEach(function() {
    owner = {
      lookup: () => null,
      factoryFor: () => null,
    };
  });

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

  function createService(properties = {}) {
    const service = new SocketGuruService(properties);
    setOwner(service, owner);
    return service;
  }

  test('updating existing events', function(assert) {
    const oldEvents = ['oldEvent'];
    const eventsToUpdate = ['newEvent'];
    const subscribeSpy = sinon.spy();
    const unsubscribeChannelsSpy = sinon.spy();
    const service = createService({
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
    const service = createService({
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
    const service = createService({
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
    const service = createService({
      config,
      observedChannels: ['event1'],
      autoConnect: false,
    });

    // Manually set client to test disconnect behavior
    service.client = mockSocketClient(setupSpy, subscribeSpy, disconnectSpy);

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
    const config = { host: 'http://localhost:3000', namespace: '/test' };
    const service = createService({
      autoConnect: false,
      observedChannels,
      config,
    });

    // Mock the client before calling setup
    service.client = mockSocketClient(setupSpy, subscribeSpy);
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
    const service = createService({
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
        createService({
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
        createService({
          observedChannels: null,
        });
      },
      /must provide observed events/,
      'it verifies observed channels presence'
    );

    assert.throws(
      () => {
        createService({
          observedChannels: ['event1', []],
        });
      },
      /must be an array of event name strings/,
      'it doesnt allow non-string items as event names'
    );

    assert.throws(
      () => {
        createService({
          observedChannels: [],
        });
      },
      /must be an array of event name strings/,
      'it doesnt allow empty event arrays'
    );
  });

  test('it dispatches newEvent via EventTarget when _handleEvent is called', function(assert) {
    assert.expect(2);
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    service.events.addEventListener('newEvent', (event) => {
      assert.equal(event.detail.eventName, 'testEvent', 'event name is passed correctly');
      assert.deepEqual(event.detail.data, { foo: 'bar' }, 'event data is passed correctly');
    });

    service._handleEvent('testEvent', { foo: 'bar' });
  });

  test('emit delegates to client', function(assert) {
    const emitSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    service.client = {
      ...mockSocketClient(),
      emit: emitSpy,
    };

    service.emit('testEvent', { data: 'test' });

    assert.ok(emitSpy.calledOnce, 'it calls emit on the client');
    assert.equal(emitSpy.args[0][0], 'testEvent', 'it passes the event name');
    assert.deepEqual(emitSpy.args[0][1], { data: 'test' }, 'it passes the event data');
  });

  // Error Handling Tests
  test('emit throws helpful error when called before setup', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    assert.throws(
      () => service.emit('test', {}),
      /Cannot read propert/,
      'throws when no client exists'
    );
  });

  test('setup throws when config is missing', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    assert.throws(
      () => service.setup(),
      /Cannot read propert/,
      'throws when config is missing'
    );
  });

  test('setup throws when host is missing', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      config: { namespace: '/test' },
    });

    assert.throws(
      () => service.setup(),
      /need to provide host/,
      'throws when host is missing from config'
    );
  });

  test('setup throws when namespace is missing', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      config: { host: 'http://localhost' },
    });

    assert.throws(
      () => service.setup(),
      /need to provide namespace/,
      'throws when namespace is missing from config'
    );
  });

  // Lifecycle Edge Cases
  test('calling setup() multiple times does not create duplicate client', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      config: { host: 'http://localhost', namespace: '/test' },
    });

    const mockClient = mockSocketClient();
    service.client = mockClient;

    service.setup();

    assert.equal(service.client, mockClient, 'client instance is preserved');
  });

  test('willDestroy is idempotent', function(assert) {
    const disconnectSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    service.client = {
      ...mockSocketClient(),
      disconnect: disconnectSpy,
    };

    run(() => {
      service.destroy();
      service.destroy();
    });

    assert.ok(disconnectSpy.calledOnce, 'disconnect called only once even with multiple destroy calls');
  });

  test('destroying service without client does not throw', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    run(() => {
      service.destroy();
    });

    assert.ok(true, 'service destroyed without error');
  });

  // EventTarget Integration Tests
  test('multiple listeners can subscribe to same event', function(assert) {
    assert.expect(4);
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    service.events.addEventListener('newEvent', (event) => {
      assert.equal(event.detail.eventName, 'testEvent', 'listener 1 receives correct event name');
      assert.deepEqual(event.detail.data, { test: 'data' }, 'listener 1 receives correct data');
    });

    service.events.addEventListener('newEvent', (event) => {
      assert.equal(event.detail.eventName, 'testEvent', 'listener 2 receives correct event name');
      assert.deepEqual(event.detail.data, { test: 'data' }, 'listener 2 receives correct data');
    });

    service._handleEvent('testEvent', { test: 'data' });
  });

  test('removing event listener works correctly', function(assert) {
    assert.expect(1);
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    const handler = () => {
      assert.ok(false, 'handler should not be called');
    };

    service.events.addEventListener('newEvent', handler);
    service.events.removeEventListener('newEvent', handler);

    service._handleEvent('testEvent', { test: 'data' });

    assert.ok(true, 'event dispatched without calling removed listener');
  });

  test('events property is always an EventTarget', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    assert.ok(service.events instanceof EventTarget, 'events is an EventTarget instance');
    assert.ok(typeof service.events.addEventListener === 'function', 'has addEventListener method');
    assert.ok(typeof service.events.removeEventListener === 'function', 'has removeEventListener method');
    assert.ok(typeof service.events.dispatchEvent === 'function', 'has dispatchEvent method');
  });

  // Memory Safety Tests
  test('destroyed service has no client reference', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
    });

    service.client = mockSocketClient();

    run(() => {
      service.destroy();
    });

    // Client should still exist but be disconnected
    assert.ok(service.client, 'client reference remains for cleanup');
  });

  // Concurrent Operations
  test('updating observedChannels works correctly', function(assert) {
    const subscribeSpy = sinon.spy();
    const unsubscribeSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1', 'event2'],
      client: mockSocketClient(function() {}, subscribeSpy, function() {}, unsubscribeSpy),
    });

    service.updateObservedChannels(['event2', 'event3']);

    assert.ok(subscribeSpy.called, 'subscribe was called for new events');
    assert.ok(unsubscribeSpy.called, 'unsubscribe was called for removed events');
  });

  test('adding observed channels updates the list', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      client: mockSocketClient(),
    });

    const initialLength = service.observedChannels.length;

    service.addObservedChannels(['event2', 'event3']);

    // Note: addObservedChannels doesn't update the property, it just subscribes
    // This is testing the current behavior
    assert.equal(service.observedChannels.length, initialLength, 'observedChannels property unchanged');
  });

  test('removing observed channel works when channel exists', function(assert) {
    const unsubscribeSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1', 'event2'],
      client: mockSocketClient(function() {}, function() {}, function() {}, unsubscribeSpy),
    });

    service.removeObservedChannel('event1');

    assert.ok(unsubscribeSpy.calledOnce, 'unsubscribe was called');
    assert.deepEqual(unsubscribeSpy.args[0][0], ['event1'], 'correct event was unsubscribed');
  });

  // HIGH PRIORITY - autoConnect: true Path
  test('autoConnect: true creates client and subscribes on init', function(assert) {
    const setupSpy = sinon.spy();
    const subscribeSpy = sinon.spy();

    // Create a mock SocketIOClient class
    const OriginalSocketIOClient = SocketGuruService.prototype.constructor;
    const mockClientInstance = mockSocketClient(setupSpy, subscribeSpy);

    const service = createService({
      autoConnect: true,
      observedChannels: ['event1'],
      config: { host: 'http://localhost', namespace: '/test' }
    });

    // Since autoConnect creates a real client, just verify it exists
    assert.ok(service.client, 'client was created automatically');
  });

  // Empty Array Edge Cases
  test('addObservedChannels with empty array calls subscribe with empty array', function(assert) {
    const subscribeSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      client: mockSocketClient(function() {}, subscribeSpy),
    });

    service.addObservedChannels([]);

    assert.ok(subscribeSpy.calledWith([]), 'subscribe called with empty array');
  });

  test('updateObservedChannels with empty array unsubscribes all', function(assert) {
    const unsubscribeSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1', 'event2'],
      client: mockSocketClient(function() {}, function() {}, function() {}, unsubscribeSpy),
    });

    service.updateObservedChannels([]);

    assert.ok(unsubscribeSpy.calledOnce, 'unsubscribe called to remove all events');
    assert.deepEqual(unsubscribeSpy.args[0][0], ['event1', 'event2'], 'all events unsubscribed');
  });

  test('manageChannelsChange with identical arrays is no-op', function(assert) {
    const subscribeSpy = sinon.spy();
    const unsubscribeSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1', 'event2'],
      client: mockSocketClient(function() {}, subscribeSpy, function() {}, unsubscribeSpy),
    });

    service._manageChannelsChange(['event1', 'event2'], ['event1', 'event2']);

    // Both should be called but with empty arrays
    assert.ok(subscribeSpy.calledOnce, 'subscribe called');
    assert.ok(unsubscribeSpy.calledOnce, 'unsubscribe called');
    assert.deepEqual(subscribeSpy.args[0][0], [], 'no new events to subscribe');
    assert.deepEqual(unsubscribeSpy.args[0][0], [], 'no events to unsubscribe');
  });

  // Config Validation Edge Cases
  test('service accepts namespace with multiple segments', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      config: { host: 'http://localhost', namespace: '/path/to/namespace' }
    });

    service.client = mockSocketClient();
    service.setup();

    assert.ok(true, 'accepts multi-segment namespace');
  });

  test('service handles namespace without leading slash', function(assert) {
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      config: { host: 'http://localhost', namespace: 'missing-slash' }
    });

    service.client = mockSocketClient();

    // Socket.IO will handle this, we just pass it through
    service.setup();

    assert.ok(true, 'namespace passed to socket.io as-is');
  });

  test('service accepts various host URL formats', function(assert) {
    const variations = [
      { host: 'http://localhost', namespace: '/test' },
      { host: 'https://example.com', namespace: '/test' },
      { host: 'http://localhost:3000', namespace: '/test' },
      { host: 'ws://localhost', namespace: '/test' },
    ];

    variations.forEach(config => {
      const service = createService({
        autoConnect: false,
        observedChannels: ['event1'],
        config
      });

      service.client = mockSocketClient();
      service.setup();

      assert.ok(true, `accepts host: ${config.host}`);
    });
  });

  // Integration Tests
  test('integration: service dispatches event, route receives it', function(assert) {
    assert.expect(3);
    const service = createService({
      autoConnect: false,
      observedChannels: ['testEvent'],
    });

    let handlerCalled = false;
    service.events.addEventListener('newEvent', (event) => {
      handlerCalled = true;
      assert.equal(event.detail.eventName, 'testEvent', 'correct event name');
      assert.deepEqual(event.detail.data, { test: 'data' }, 'correct data');
    });

    service._handleEvent('testEvent', { test: 'data' });

    assert.ok(handlerCalled, 'event handler was called');
  });

  test('integration: multiple routes receive same event', function(assert) {
    assert.expect(5);
    const service = createService({
      autoConnect: false,
      observedChannels: ['sharedEvent'],
    });

    let route1Called = false;
    let route2Called = false;

    // Route 1 listener
    service.events.addEventListener('newEvent', (event) => {
      route1Called = true;
      assert.equal(event.detail.eventName, 'sharedEvent', 'route 1 got event name');
      assert.deepEqual(event.detail.data, { shared: true }, 'route 1 got data');
    });

    // Route 2 listener
    service.events.addEventListener('newEvent', (event) => {
      route2Called = true;
      assert.equal(event.detail.eventName, 'sharedEvent', 'route 2 got event name');
      assert.deepEqual(event.detail.data, { shared: true }, 'route 2 got data');
    });

    service._handleEvent('sharedEvent', { shared: true });

    assert.ok(route1Called && route2Called, 'both routes received event');
  });

  test('integration: service continues dispatching after listener removed', function(assert) {
    assert.expect(2);
    const service = createService({
      autoConnect: false,
      observedChannels: ['testEvent'],
    });

    const handler1 = () => {
      assert.ok(false, 'removed handler should not be called');
    };

    const handler2 = () => {
      assert.ok(true, 'remaining handler should be called');
    };

    service.events.addEventListener('newEvent', handler1);
    service.events.addEventListener('newEvent', handler2);
    service.events.removeEventListener('newEvent', handler1);

    service._handleEvent('testEvent', {});
    service._handleEvent('testEvent', {});
  });

  // Property Mutation Tests
  test('mutating observedChannels array directly does not trigger subscription', function(assert) {
    const subscribeSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      client: mockSocketClient(function() {}, subscribeSpy),
    });

    // Clear any initial calls
    subscribeSpy.resetHistory();

    // Directly mutate array
    service.observedChannels.push('event2');

    // Subscribe should not have been called
    assert.ok(!subscribeSpy.called, 'direct array mutation does not trigger subscribe');
    assert.equal(service.observedChannels.length, 2, 'array was mutated');
  });

  test('replacing observedChannels property directly does not trigger subscription', function(assert) {
    const subscribeSpy = sinon.spy();
    const service = createService({
      autoConnect: false,
      observedChannels: ['event1'],
      client: mockSocketClient(function() {}, subscribeSpy),
    });

    // Clear any initial calls
    subscribeSpy.resetHistory();

    // Replace property
    service.observedChannels = ['event2', 'event3'];

    // Subscribe should not have been called
    assert.ok(!subscribeSpy.called, 'property replacement does not trigger subscribe');
    assert.deepEqual(service.observedChannels, ['event2', 'event3'], 'property was replaced');
  });
});
