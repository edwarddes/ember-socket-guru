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

  // MEDIUM PRIORITY - Type Validation
  test('verifyArrayStructure rejects empty strings', function(assert) {
    assert.notOk(
      verifyArrayStructure(['event1', '', 'event2']),
      'rejects empty strings'
    );
  });

  test('verifyArrayStructure rejects whitespace-only strings', function(assert) {
    assert.notOk(
      verifyArrayStructure(['event1', '   ', 'event2']),
      'rejects whitespace-only strings'
    );

    assert.notOk(
      verifyArrayStructure(['event1', '\t', 'event2']),
      'rejects tab-only strings'
    );
  });

  test('verifyArrayStructure rejects numbers', function(assert) {
    assert.notOk(
      verifyArrayStructure(['event1', 123, 'event2']),
      'rejects numbers'
    );

    assert.notOk(
      verifyArrayStructure([0, 'event1']),
      'rejects zero'
    );
  });

  test('verifyArrayStructure rejects objects', function(assert) {
    assert.notOk(
      verifyArrayStructure(['event1', {}, 'event2']),
      'rejects empty objects'
    );

    assert.notOk(
      verifyArrayStructure(['event1', { event: 'name' }, 'event2']),
      'rejects objects with properties'
    );
  });

  test('verifyArrayStructure rejects null and undefined', function(assert) {
    assert.notOk(
      verifyArrayStructure(['event1', null, 'event2']),
      'rejects null'
    );

    assert.notOk(
      verifyArrayStructure(['event1', undefined, 'event2']),
      'rejects undefined'
    );
  });

  test('verifyArrayStructure accepts valid string patterns', function(assert) {
    assert.ok(
      verifyArrayStructure(['event1', 'event-2', 'event_3', 'event.4']),
      'accepts strings with dashes, underscores, and dots'
    );

    assert.ok(
      verifyArrayStructure(['camelCase', 'PascalCase', 'snake_case', 'kebab-case']),
      'accepts various naming conventions'
    );

    assert.ok(
      verifyArrayStructure(['event:action', 'namespace/event']),
      'accepts strings with colons and slashes'
    );
  });

  test('verifyArrayStructure handles single-element arrays', function(assert) {
    assert.ok(
      verifyArrayStructure(['singleEvent']),
      'accepts single-element array'
    );
  });
});
