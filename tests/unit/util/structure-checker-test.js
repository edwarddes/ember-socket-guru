import { verifyArrayStructure } from 'ember-socket-guru/util/structure-checker';
import { module, test } from 'qunit';

module('Unit | Utility | Structure Checker', function() {
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
