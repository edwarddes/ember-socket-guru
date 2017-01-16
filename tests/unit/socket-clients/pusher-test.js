import PusherClient from 'ember-socket-guru/socket-clients/pusher';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Socket Clients | pusher');

const getPusherStub = (
  bindSpy,
  subscribeSpy = function() {},
  unsubscribeSpy = function() {},
  disconnectSpy = function() {}
) => {
  const pusherStub = class {};
  pusherStub.prototype = {
    subscribe: subscribeSpy,
    unsubscribe: unsubscribeSpy,
    disconnect: disconnectSpy,
    connection: { bind: bindSpy },
  };

  return pusherStub;
};

test('setup function', function(assert) {
  const bindSpy = sinon.spy();
  const pusherStub = getPusherStub(bindSpy);
  const client = PusherClient.create({
    pusherService: pusherStub,
  });

  client.setup({ pusherKey: 'foo' });
  assert.ok(bindSpy.calledOnce, 'a bind method is called on pusher instance');
  const [action] = bindSpy.args[0];
  assert.equal(
    action,
    'connected',
    'proper event name is passed to pusher'
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
  client.subscribe([
    { channel1: ['event1'] },
  ]);

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
  client.unsubscribeChannels([
    { channel1: ['event1'] },
  ]);

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
