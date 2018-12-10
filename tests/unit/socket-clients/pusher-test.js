import { get } from '@ember/object';
import PusherClient from 'ember-socket-guru/socket-clients/pusher';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Socket Clients | pusher');

const getPusherStub = sinon.spy((
  bind = () => {},
  subscribe = () => {},
  unsubscribe = () => {},
  disconnect = () => {}
) => function() {
  Object.assign(this, {
    subscribe, unsubscribe, disconnect, connection: { bind },
  });
});

test('it verifies required config options', function(assert) {
  const client = PusherClient.create({
    pusherService: getPusherStub(),
  });

  assert.throws(() => {
    client.setup({});
  }, /need to provide pusher key/, 'it throws when no pusherKey present');

  const pusherInstance = window.Pusher;
  window.Pusher = null;

  assert.throws(() => {
    client.setup({ pusherKey: 'FOO_KEY' });
  }, /need to include the pusher library/, 'it throws when pusher not installed');

  window.Pusher = pusherInstance;
});

test('setup function', function(assert) {
  const bindSpy = sinon.spy();
  const pusherStub = getPusherStub(bindSpy);
  let client = PusherClient.create({
    pusherService: pusherStub,
  });

  client.setup({ pusherKey: 'foo', cluster: 'APP_CLUSTER' });
  assert.ok(bindSpy.calledOnce, 'a bind method is called on pusher instance');
  const [action] = bindSpy.args[0];
  assert.equal(
    action,
    'connected',
    'proper event name is passed to pusher'
  );

  const spy = sinon.spy(() => ({ connection: { bind() {} } }));
  client = PusherClient.create({
    pusherService: spy,
  });

  client.setup({ pusherKey: 'foo', cluster: 'APP_CLUSTER' });
  assert.ok(spy.calledWithNew, 'it calls the constructor');
  assert.equal(spy.firstCall.args[0], 'foo', 'it passes proper key');
  assert.deepEqual(
    spy.firstCall.args[1],
    { cluster: 'APP_CLUSTER' },
    'it passes proper additional configs'
  );
});

test('subscribe method', function(assert) {
  const channelBindSpy = sinon.spy();
  const subscribeSpy = sinon.spy(() => ({
    bind: channelBindSpy,
  }));
  const pusherStub = getPusherStub(sinon.spy(), subscribeSpy);
  const client = PusherClient.create({
    pusherService: pusherStub,
  });

  client.setup({ pusherKey: 'foo' });
  client.subscribe({ channel1: ['event1'] });

  assert.ok(subscribeSpy.calledOnce, 'it calls subscribe on pusher');
  assert.equal(
    subscribeSpy.args[0][0],
    'channel1',
    'it passes proper channel name to pusher client for subscription'
  );
  assert.ok(channelBindSpy.calledOnce, 'it calls bind on channel');
  assert.equal(
    channelBindSpy.args[0][0],
    'event1',
    'it passes proper event name to pusher client for subscription'
  );
});

test('unsubscribe method', function(assert) {
  const unsubscribeSpy = sinon.spy();
  const pusherStub = getPusherStub(
    function() {}, function() {}, unsubscribeSpy
  );

  const client = PusherClient.create({
    pusherService: pusherStub,
  });

  client.setup({ pusherKey: 'foo' });
  client.unsubscribeChannels({
    channel1: ['event1'],
  });

  assert.ok(unsubscribeSpy.calledOnce, 'it calls unsubscribe on pusher client');
  assert.equal(
    unsubscribeSpy.args[0][0],
    'channel1',
    'it passes correct channel name to be unsubscribed by pusher client'
  );
});

test('disconnect method', function(assert) {
  const disconnectSpy = sinon.spy();
  const pusherStub = getPusherStub(
    function() {}, function() {}, function() {}, disconnectSpy
  );

  const client = PusherClient.create({
    pusherService: pusherStub,
  });

  client.setup({ pusherKey: 'foo' });
  client.disconnect();

  assert.ok(disconnectSpy.calledOnce, 'disconnect is called on pusher instance');
});

test('it stores list of joined channels', function(assert) {
  const channels = {
    channel1: ['event1'],
    channel2: ['event2'],
  };
  const subscribeSpy = sinon.spy(() => ({
    bind() {},
  }));
  const client = PusherClient.create({
    pusherService: getPusherStub(sinon.spy(), subscribeSpy),
  });

  client.setup({ pusherKey: 'foo' });
  client.subscribe(channels);
  assert.deepEqual(Object.keys(get(client, 'joinedChannels')), Object.keys(channels));
});

test('emit method', function(assert) {
  const triggerSpy = sinon.spy();
  const subscribeSpy = sinon.spy(() => ({
    bind() {},
    trigger: triggerSpy,
  }));
  const client = PusherClient.create({
    pusherService: getPusherStub(sinon.spy(), subscribeSpy),
  });

  client.setup({ pusherKey: 'foo' });
  client.subscribe({ channel1: ['event1'] });
  const eventData = { foo: 'bar' };
  const emitArguments = ['event-name', eventData];
  client.emit('channel1', ...emitArguments);
  assert.ok(triggerSpy.calledOnce);
  assert.deepEqual(triggerSpy.args[0], emitArguments);
});
