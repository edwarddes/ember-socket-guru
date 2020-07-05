import {
  verifyArrayStructure,
  verifyObjectStructure,
} from 'ember-socket-guru/util/structure-checker';
import { module, test } from 'qunit';

module('Unit | Utility | Structure Checker', function() {
  test('it properly verifies object structure', function(assert) {
    assert.ok(
      verifyObjectStructure({ channel1: ['event1'], channel2: ['event2', 'event3'] }),
      'it accepts proper structure'
    );
    assert.notOk(
      verifyObjectStructure({ channel1: 'event1' }),
      'it doesnt accept events if theyre not in array'
    );
    assert.notOk(
      verifyObjectStructure({ channel1: ['event1', { foo: 'bar' }] }),
      'it doesnt accept event names if theyre not strings'
    );
    assert.notOk(
      verifyObjectStructure({}),
      'it doesnt accept empty objects'
    );
    assert.notOk(
      verifyObjectStructure({ channel1: ['event'], channel2: [] }),
      'it detects channels without events'
    );
  });

  test('it properly verifies array structure', function(assert) {
    assert.ok(
      verifyArrayStructure(['event1', 'event2']),
      'it accepts proper structure'
    );
    assert.notOk(
      verifyArrayStructure(['event1', { foo: 'bar' }]),
      'it doesnt accept items that are not strings'
    );

    assert.notOk(
      verifyArrayStructure([]),
      'it doesnt allow empty events array'
    );
  });
});
