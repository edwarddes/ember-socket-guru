import { eventsDiff, removeEvent } from 'ember-socket-guru/util/events-diff';
import { module, test } from 'qunit';

module('Unit | Utility | eventsDiff', function() {
  test('it properly diffs when channels same', function(assert) {
    const events1 = ['event1', 'event2'];
    const events2 = events1;
    assert.deepEqual(
      eventsDiff(events1, events2),
      {
        channelsToSubscribe: [],
        channelsToUnsubscribe: [],
      },
      'it returns empty arrays since events the same'
    );
  });

  test('it properly diffs when events different', function(assert) {
    const eventsSubscribed = ['event1', 'event2'];
    const newEvents = ['event1', 'event3'];
    const {
      channelsToSubscribe, channelsToUnsubscribe,
    } = eventsDiff(eventsSubscribed, newEvents);

    assert.deepEqual(
      channelsToSubscribe,
      ['event3'],
      'it properly shows events to subscribe'
    );

    assert.deepEqual(
      channelsToUnsubscribe,
      ['event2'],
      'it properly shows events to unsubscribe'
    );
  });

  test('it properly removes events', function(assert) {
    const eventsSubscribed = ['event1', 'event2'];
    assert.deepEqual(
      removeEvent(eventsSubscribed, 'event1'),
      ['event2'],
      'it properly removes event1'
    );
  });
});
