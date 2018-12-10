import { get } from '@ember/object';
import Ember from 'ember';
import ActionCableClient from 'ember-socket-guru/socket-clients/action-cable';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Socket Clients | Action Cable', {
  beforeEach() {
    sinon.spy(ActionCable, 'createConsumer');
    sinon.spy(ActionCable.Subscription.prototype, 'unsubscribe');
    sinon.spy(ActionCable.Subscription.prototype, 'send');
    sinon.spy(ActionCable.Consumer.prototype, 'disconnect');
  },
  afterEach() {
    ActionCable.createConsumer.restore();
    ActionCable.Subscription.prototype.unsubscribe.restore();
    ActionCable.Subscription.prototype.send.restore();
    ActionCable.Consumer.prototype.disconnect.restore();
  },
});

const {
  K
} = Ember;
const testConfig = {
  socketAddress: 'ws://0.0.0.0:28080',
};
const testChannels = ['cha1', 'cha2', 'cha3'];

test('throw exception if config is not provided', function(assert) {
  const subject = ActionCableClient.create();
  assert.throws(() => subject.setup());
});

test('throw exception if eventHandler is not provided', function(assert) {
  const subject = ActionCableClient.create();
  assert.throws(() => subject.setup(testConfig));
});

test('setup method creates Action Cable connection', function(assert) {
  const subject = ActionCableClient.create();
  subject.setup(testConfig, K);

  const actionCableService = get(subject, 'actionCableService');
  assert.ok(actionCableService.createConsumer.calledOnce);
  assert.ok(actionCableService.createConsumer.calledWith(testConfig.socketAddress));
  assert.notEqual(get(subject, 'actionCable'), null);
});

test('subscription to channels and handling events', function(assert) {
  const subject = ActionCableClient.create();
  const eventHandler = sinon.spy();

  subject.setup(testConfig, eventHandler);
  subject.subscribe(testChannels);

  const joinedChannels = get(subject, 'joinedChannels');

  assert.equal(eventHandler.callCount, testChannels.length);
  assert.equal(eventHandler.getCall(0).args[0], 'initialized');
  assert.equal(Object.keys(joinedChannels).join(), testChannels.join());
});

test('unsubscription from channels', function(assert) {
  const subject = ActionCableClient.create();
  const selectedChannel = testChannels[1];

  subject.setup(testConfig, K);
  subject.subscribe(testChannels);

  const joinedChannelsLength =
    Object.keys(get(subject, 'joinedChannels')).length;

  assert.equal(joinedChannelsLength, testChannels.length);
  subject.unsubscribeChannels(Array(selectedChannel));

  const actionCableService = get(subject, 'actionCableService');
  assert.ok(
    actionCableService.Subscription.prototype.unsubscribe.calledOnce
  );
  assert.equal(
    Object.keys(get(subject, 'joinedChannels')).indexOf(selectedChannel), -1
  );
  assert.equal(
    Object.keys(get(subject, 'joinedChannels')).length,
    testChannels.length - 1
  );
});

test('disconnect from websocket', function(assert) {
  const subject = ActionCableClient.create();
  subject.setup(testConfig, K);
  subject.disconnect();

  assert.ok(
    get(subject, 'actionCableService').Consumer.prototype.disconnect.calledOnce
  );
});

test('sending data to websocket', function(assert) {
  const subject = ActionCableClient.create();
  const testChannel = testChannels[0];
  const testMessage = 'Lorem ipsum';

  subject.setup(testConfig, K);
  subject.subscribe(Array(testChannel));
  subject.emit(testChannel, testMessage);

  assert.ok(
    get(subject, 'actionCableService').Subscription.prototype.send.calledOnce
  );
});

test('sending data to unsubscribed channel', function(assert) {
  const subject = ActionCableClient.create();
  const goodChannel = 'good place';
  const wrongChannel = 'wrong place';
  const testMessage = 'Lorem ipsum';

  subject.setup(testConfig, K);
  subject.subscribe(Array(goodChannel));
  assert.throws(() => subject.emit(wrongChannel, testMessage));
});
