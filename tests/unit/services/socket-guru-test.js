import { get } from '@ember/object';
import { run } from '@ember/runloop';
import SocketGuruService from 'ember-socket-guru/services/socket-guru';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Service | socket guru', function() {
  const socketClient = (
    setupSpy = function() {},
    subscribeSpy = function() {},
    disconnectSpy = function() {},
    unsubscribeChannelsSpy = function() {},
    hasNoChannels = false
  ) => ({
    setup: setupSpy,
    subscribe: subscribeSpy,
    disconnect: disconnectSpy,
    unsubscribeChannels: unsubscribeChannelsSpy,
    hasNoChannels,
  });

  function testUpdating(withChannels = null) {
    test(`updating existing ${withChannels || ''}`, function(assert) {
      const oldChannels = withChannels ? { oldChannel: ['oldData'] } : ['oldEvent'];
      const channelsToUpdate = withChannels ? { testChannel: ['event1'] } : ['newEvent'];
      const subscribeSpy = sinon.spy();
      const unsubscribeChannelsSpy = sinon.spy();
      const socketClientLookup = () => {
        return socketClient(
          function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy, !withChannels
        );
      };
      const service = SocketGuruService.create({
        client: socketClientLookup(),
        autoConnect: false,
        observedChannels: oldChannels,
        socketClient: withChannels ? 'pusher' : 'socketio',
      });

      service.updateObservedChannels(channelsToUpdate);

      assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe method on the client');
      assert.deepEqual(
        subscribeSpy.args[0][0],
        channelsToUpdate,
        'it passes proper channels to unsubscribe'
      );

      assert.ok(unsubscribeChannelsSpy.calledOnce, 'it calls the unsubscribe method on the client');
      assert.deepEqual(
        unsubscribeChannelsSpy.args[0][0],
        oldChannels,
        'it passes proper channels for the client to unsubscribe'
      );
    });
  }

  function testAdding(withChannels = null) {
    test(`adding observed ${withChannels || ''}`, function(assert) {
      const subscribeSpy = sinon.spy();
      const unsubscribeChannelsSpy = sinon.spy();
      const socketClientLookup = () => {
        return socketClient(
          function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy, !withChannels
        );
      };
      const observedChannels = withChannels ? { oldChannel: ['oldData'] } : ['oldEvent'];
      const service = SocketGuruService.create({
        observedChannels,
        client: socketClientLookup(),
        autoConnect: false,
        socketClient: withChannels ? 'pusher' : 'socketio',
      });

      const channelsToAdd = withChannels ? { testChannel: ['event1'] } : ['newEvent'];
      service.addObservedChannels(channelsToAdd);

      assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe method on the client');
      assert.deepEqual(
        subscribeSpy.args[0][0],
        channelsToAdd,
        'it passes proper arguments to the client'
      );
    });
  }

  function testRemoving(withChannels = null) {
    test(`removing channels ${withChannels || ''}`, function(assert) {
      const subscribeSpy = sinon.spy();
      const unsubscribeChannelsSpy = sinon.spy();
      const socketClientLookup = () => {
        return socketClient(
          function() {}, subscribeSpy, function() {}, unsubscribeChannelsSpy, !withChannels
        );
      };
      const observedChannels = withChannels
        ? { oldChannel: ['oldData'], oldChannel2: ['oldEvent2'] }
        : ['oldChannel', 'oldEvent2'];
      const service = SocketGuruService.create({
        observedChannels,
        client: socketClientLookup(),
        autoConnect: false,
        socketClient: withChannels ? 'pusher' : 'socketio',
      });
      const expectedDeletedChannels = withChannels
        ? { oldChannel: ['oldData'] }
        : ['oldChannel'];

      service.removeObservedChannel('oldChannel');

      assert.ok(unsubscribeChannelsSpy.calledOnce, 'it calls the unsubscribe method on the client');
      assert.deepEqual(
        unsubscribeChannelsSpy.args[0],
        [expectedDeletedChannels],
        'it passes proper arguments'
      );
    });
  }

  test('setup function', function(assert) {
    const setupSpy = sinon.spy();
    const disconnectSpy = sinon.spy();
    const client = socketClient(setupSpy, function() {}, disconnectSpy);
    const socketClientLookupSpy = sinon.spy(() => client);
    const config = { setting: 'FOO' };
    const service = SocketGuruService.create({
      pusherKey: 'FOO',
      config,
      socketClient: 'pusher',
      observedChannels: { channel1: ['event1'] },
      socketClientLookup: socketClientLookupSpy,
    });

    assert.ok(socketClientLookupSpy.calledOnce, 'it uses socketClient lookup');
    assert.equal(socketClientLookupSpy.args[0][1], 'pusher', 'it passes proper socketClient name');
    assert.deepEqual(get(service, 'client'), client, 'it sets the client properly');
    assert.ok(setupSpy.calledOnce, 'it calls the setup function on socketClient');
    assert.deepEqual(
      setupSpy.args[0][0],
      config,
      'it calls the setup function on socketClient passing the config'
    );

    run(() => {
      service.destroy();
    });

    assert.ok(
      disconnectSpy.calledOnce,
      'it calls the unsubscribe function on socketClient when destroyed'
    );
  });

  test('it delegates subscription to socketClient', function(assert) {
    const subscribeSpy = sinon.spy();
    const observedChannels = {
      channel1: ['event1'],
    };
    const socketClientLookup = () => socketClient(function() {}, subscribeSpy);
    SocketGuruService.create({
      autoConnect: true,
      observedChannels,
      socketClientLookup,
      socketClient: 'pusher',
    });

    assert.ok(subscribeSpy.calledOnce, 'it calls the subscribe function on socketClient');
    assert.deepEqual(
      subscribeSpy.args[0][0],
      observedChannels,
      'it passes the observed channels to the subscribe function on socketClient'
    );
  });

  test('it calls subscribe on socketClient only if autoConnect true', function(assert) {
    const subscribeSpy = sinon.spy();
    const setupSpy = sinon.spy();
    const socketClientLookup = () => socketClient(setupSpy, subscribeSpy);
    SocketGuruService.create({
      socketClientLookup,
      observedChannels: { channel1: ['event1'] },
      socketClient: 'pusher',
    });

    assert.ok(
      subscribeSpy.calledOnce && setupSpy.calledOnce,
      'it calls the setup and subscribe functions by default'
    );
  });

  test('it doesnt call subscribe on on socketClient if autoConnect false', function(assert) {
    const subscribeSpy = sinon.spy();
    const setupSpy = sinon.spy();
    const socketClientLookup = () => socketClient(setupSpy, subscribeSpy);
    SocketGuruService.create({
      autoConnect: false,
      socketClientLookup,
      socketClient: 'pusher',
    });

    assert.notOk(
      subscribeSpy.calledOnce || setupSpy.calledOnce,
      'it doesnt call setup and subscribe'
    );
  });

  test('it checks the observedChannels structure', function(assert) {
    const noop = () => {};
    const socketClientLookup = (_, clientName) => {
      const hasNoChannels = clientName === 'socketio' || clientName === 'action-cable';
      return socketClient(noop, noop, noop, noop, hasNoChannels);
    };

    assert.throws(
      () => {
        SocketGuruService.create({
          socketClientLookup,
          socketClient: 'pusher',
          observedChannels: ['event1', 'event2'],
        });
      },
      /must have correct structure/,
      'it verifies the observed channels structure for pusher'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          socketClientLookup,
          socketClient: 'phoenix-channels',
          observedChannels: ['event1', 'event2'],
        });
      },
      /must have correct structure/,
      'it verifies the observed channels structure for phoenix'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          socketClientLookup,
          socketClient: 'socketio',
          observedChannels: {
            channel1: ['event1'],
          },
        });
      },
      /must have correct structure/,
      'it verifies the observed channels structure for socket'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          socketClientLookup,
          socketClient: 'action-cable',
          observedChannels: {
            channel1: ['event1'],
          },
        });
      },
      /must have correct structure/,
      'it verifies the observed channels structure for action-cable'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          socketClientLookup,
          observedChannels: {
            channel1: ['event1'],
          },
        });
      },
      /must provide socketClient/,
      'it verifies the socketClient property presence'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          socketClientLookup,
        });
      },
      /must provide observed channels/,
      'it verifies observed channels presence'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          socketClientLookup,
          socketClient: 'socketio',
          observedChannels: ['event1', []],
        });
      },
      /must have correct structure/,
      'it doesnt allow non-string objects as event names'
    );

    assert.throws(
      () => {
        SocketGuruService.create({
          socketClientLookup,
          socketClient: 'pusher',
          observedChannels: {
            channel1: [],
          },
        });
      },
      /must have correct structure/,
      'it doesnt allow channels without any events'
    );
  });

  testAdding();
  testAdding('withChannels');
  testUpdating();
  testUpdating('withChannels');
  testRemoving();
  testRemoving('withChannels');
});
