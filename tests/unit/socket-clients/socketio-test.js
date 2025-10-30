import SocketIOClient from 'ember-socket-guru/socket-clients/socketio';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Socket Clients | socketio', function() {
  test('verifies required socket.io config options', function(assert) {
    const client = new SocketIOClient();

    assert.throws(() => {
      client.setup({});
    }, /need to provide host/, 'it throws when no host present');

    assert.throws(() => {
      client.setup({ host: 'http://localhost' });
    }, /need to provide namespace/, 'it throws when no namespace present');
  });

  test('setup function creates socket with proper config', function(assert) {
    const connectSpy = sinon.spy();
    const socket = {
      connect: connectSpy,
      on: sinon.spy(),
    };
    const ioStub = sinon.spy(() => socket);

    // Temporarily replace the io import for testing
    const originalIo = SocketIOClient.prototype._getIo;
    SocketIOClient.prototype._getIo = () => ioStub;

    const client = new SocketIOClient();
    const eventHandlerSpy = sinon.spy();

    client.setup(
      { host: 'http://localhost:1234', namespace: '/test' },
      eventHandlerSpy
    );

    assert.ok(ioStub.calledOnce, 'io() was called');
    assert.equal(ioStub.firstCall.args[0], 'http://localhost:1234', 'host passed correctly');
    assert.equal(
      ioStub.firstCall.args[1].path,
      '/test/socket.io',
      'namespace path configured correctly'
    );
    assert.ok(connectSpy.calledOnce, 'socket.connect() was called');
    assert.equal(client.eventHandler, eventHandlerSpy, 'eventHandler stored correctly');

    // Restore original
    SocketIOClient.prototype._getIo = originalIo;
  });

  test('subscribe method', function(assert) {
    const onSpy = sinon.spy();
    const socket = {
      connect: sinon.spy(),
      on: onSpy,
    };

    const client = new SocketIOClient();
    client.socket = socket;
    client.eventHandler = sinon.spy();

    client.subscribe(['event1', 'event2']);

    assert.ok(onSpy.calledTwice, 'on() called twice');
    assert.equal(onSpy.firstCall.args[0], 'event1', 'first event subscribed');
    assert.equal(onSpy.secondCall.args[0], 'event2', 'second event subscribed');
  });

  test('disconnect method', function(assert) {
    const disconnectSpy = sinon.spy();
    const client = new SocketIOClient();
    client.socket = {
      disconnect: disconnectSpy,
    };

    client.disconnect();

    assert.ok(disconnectSpy.calledOnce, 'disconnect called on socket');
  });

  test('emit method', function(assert) {
    const emitSpy = sinon.spy();
    const client = new SocketIOClient();
    client.socket = {
      emit: emitSpy,
    };

    const args = ['fooEvent', { fooKey: 'fooValue' }];
    client.emit(...args);

    assert.ok(emitSpy.calledOnce, 'it calls sockets emit method');
    assert.deepEqual(emitSpy.args[0], args, 'it passes in proper arguments');
  });

  test('unsubscribeChannels is a no-op', function(assert) {
    const client = new SocketIOClient();

    // Should not throw
    client.unsubscribeChannels(['event1', 'event2']);

    assert.ok(true, 'unsubscribeChannels completes without error');
  });

  // HIGH PRIORITY - Event Flow Test
  test('socketio client calls eventHandler when socket event fires', function(assert) {
    assert.expect(2);

    const client = new SocketIOClient();
    const eventHandlerSpy = sinon.spy();

    // Create a mock socket that stores and can trigger callbacks
    const mockSocket = {
      connect: sinon.spy(),
      _callbacks: {},
      on: function(eventName, callback) {
        this._callbacks[eventName] = callback;
      }
    };

    client._getIo = () => () => mockSocket;
    client.setup({ host: 'http://localhost', namespace: '/test' }, eventHandlerSpy);
    client.subscribe(['testEvent']);

    // Simulate socket.io firing an event
    mockSocket._callbacks['testEvent']({ foo: 'bar' });

    assert.ok(eventHandlerSpy.calledOnce, 'eventHandler called when socket event fires');
    assert.deepEqual(eventHandlerSpy.args[0], ['testEvent', { foo: 'bar' }], 'correct args passed to handler');
  });

  // Socket Client Error Scenarios
  test('socketio disconnect with no socket does not throw', function(assert) {
    const client = new SocketIOClient();

    // socket is null, should not throw
    client.disconnect();

    assert.ok(true, 'disconnect handles null socket gracefully');
  });

  test('socketio emit with no socket throws', function(assert) {
    const client = new SocketIOClient();

    assert.throws(() => {
      client.emit('test', {});
    }, /Cannot read propert/, 'throws when socket is null');
  });

  test('socketio subscribe with no socket throws', function(assert) {
    const client = new SocketIOClient();

    assert.throws(() => {
      client.subscribe(['test']);
    }, /Cannot read propert/, 'throws when socket is null');
  });

  test('socketio setup with invalid io throws error', function(assert) {
    const client = new SocketIOClient();

    // Mock _getIo to throw
    client._getIo = () => {
      return () => {
        throw new Error('Connection failed');
      };
    };

    assert.throws(() => {
      client.setup({ host: 'http://localhost', namespace: '/test' }, () => {});
    }, /Connection failed/, 'throws when io() fails');
  });
});
