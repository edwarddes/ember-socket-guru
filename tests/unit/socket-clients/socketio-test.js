import { get } from '@ember/object';
import SocketIOClient from 'ember-socket-guru/socket-clients/socketio';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Socket Clients | socketio');

const createIoStub = (
  connect = () => {},
  on = () => {},
  disconnect = () => {},
  emit = () => {}
) => {
  return () => ({ connect, on, disconnect, emit });
};

test('verifies required socket.io config options', function(assert) {
  const client = SocketIOClient.create();

  assert.throws(() => {
    client.setup({});
  }, /need to provide host/, 'it throws when no host present');
});

test('verifies socketio client library passed in', function(assert) {
  const client = SocketIOClient.create({
    ioService: null,
  });

  assert.throws(
    () => client.setup({ host: 'http://locahost:1234' }),
    /need to make sure the socket.io client library/,
    'it throws when socketio client not installed'
  );
});

test('setup function', function(assert) {
  const connectSpy = sinon.spy();
  const ioStub = sinon.spy(() => ({
    connect: connectSpy,
  }));
  const eventHandlerSpy = sinon.spy();
  const client = SocketIOClient.create({
    ioService: ioStub,
  });

  const clientOptions = { foo: 'bar' };

  client.setup(
    { host: 'http://localhost:1234', ...clientOptions },
    eventHandlerSpy
  );

  assert.ok(ioStub.calledOnce);
  assert.equal(ioStub.firstCall.args[0], 'http://localhost:1234');
  assert.deepEqual(ioStub.firstCall.args[1], clientOptions, 'it passes client options to socketio');
  assert.ok(connectSpy.calledOnce);
  assert.equal(get(client, 'eventHandler'), eventHandlerSpy);
});

test('subscribe method', function(assert) {
  const onSpy = sinon.spy();
  const ioStub = createIoStub(() => {}, onSpy);
  const client = SocketIOClient.create({
    ioService: ioStub,
  });

  const handlerSpy = sinon.spy().bind(this);

  client.setup({ host: 'foo' }, handlerSpy);
  client.subscribe(['event1', 'event2']);

  const [firstCallArgs, secondCallArgs] = onSpy.args;

  assert.deepEqual(firstCallArgs, ['event1', handlerSpy]);
  assert.deepEqual(secondCallArgs, ['event2', handlerSpy]);
});

test('disconnect method', function(assert) {
  const disconnectSpy = sinon.spy();
  const client = SocketIOClient.create({
    ioService: createIoStub(sinon.spy(), sinon.spy(), disconnectSpy),
  });

  client.setup({ host: 'host' }, sinon.spy());
  client.disconnect();

  assert.ok(disconnectSpy.calledOnce);
});

test('emit method', function(assert) {
  const emitSpy = sinon.spy();
  const client = SocketIOClient.create({
    ioService: createIoStub(
      sinon.spy(), sinon.spy(), sinon.spy(), emitSpy
    ),
  });

  client.setup({ host: 'host' }, sinon.spy());
  const args = ['fooEvent', { fooKey: 'fooValue' }];
  client.emit(...args);

  assert.ok(emitSpy.calledOnce, 'it calls sockets emit method');
  assert.deepEqual(emitSpy.args[0], args, 'it passes in proper arguments');
});
