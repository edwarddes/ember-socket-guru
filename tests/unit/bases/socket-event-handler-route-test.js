import { setOwner } from '@ember/application';
import { run } from '@ember/runloop';
import SocketEventHandlerRoute from 'ember-socket-guru/bases/socket-event-handler-route';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Base | socket event handler route', function(hooks) {
  let owner;

  hooks.beforeEach(function() {
    owner = {
      lookup: () => ({
        events: new EventTarget(),
      }),
    };
  });

  function createMockSocketGuru() {
    return {
      events: new EventTarget(),
    };
  }

  test('_handleEvent method calls socketActions', function(assert) {
    const funcSpy = sinon.spy();
    const mockSocketGuru = createMockSocketGuru();

    class TestRoute extends SocketEventHandlerRoute {
      socketActions = {
        event1: funcSpy,
      };
    }

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    // Simulate event
    const event = new CustomEvent('newEvent', {
      detail: { eventName: 'event1', data: { foo: 'bar' } }
    });

    route._handleEvent(event);

    assert.ok(funcSpy.calledOnce, 'handler method is called');
    assert.deepEqual(funcSpy.args[0][0], { foo: 'bar' }, 'data passed correctly');
  });

  test('it detaches events when route destroyed', function(assert) {
    const mockSocketGuru = createMockSocketGuru();
    const removeEventListenerSpy = sinon.spy(mockSocketGuru.events, 'removeEventListener');

    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    run(() => {
      route.destroy();
    });

    assert.ok(removeEventListenerSpy.calledOnce, 'it calls removeEventListener on destroy');
  });

  test('it calls onSocketAction when no specific handler found', function(assert) {
    const onSocketActionSpy = sinon.spy();
    const mockSocketGuru = createMockSocketGuru();

    class TestRoute extends SocketEventHandlerRoute {
      onSocketAction = onSocketActionSpy;
    }

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    const event = new CustomEvent('newEvent', {
      detail: { eventName: 'unknownEvent', data: { foo: 'bar' } }
    });

    route._handleEvent(event);

    assert.ok(onSocketActionSpy.calledOnce, 'onSocketAction called');
    assert.equal(onSocketActionSpy.args[0][0], 'unknownEvent', 'event name passed');
    assert.deepEqual(onSocketActionSpy.args[0][1], { foo: 'bar' }, 'data passed');
  });

  test('it doesnt blow up when no actions and no eventHandler specified', function(assert) {
    const mockSocketGuru = createMockSocketGuru();

    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    const event = new CustomEvent('newEvent', {
      detail: { eventName: 'event1', data: { foo: 'bar' } }
    });

    route._handleEvent(event);

    assert.ok(true, 'it does not raise any exceptions');
  });

  test('it listens to socketGuru events on init', function(assert) {
    const mockSocketGuru = createMockSocketGuru();
    const addEventListenerSpy = sinon.spy(mockSocketGuru.events, 'addEventListener');

    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    assert.ok(addEventListenerSpy.calledOnce, 'addEventListener called');
    assert.equal(addEventListenerSpy.args[0][0], 'newEvent', 'listening to newEvent');
  });

  // Lifecycle Tests
  test('setupSocketListeners is idempotent', function(assert) {
    const mockSocketGuru = createMockSocketGuru();
    const addEventListenerSpy = sinon.spy(mockSocketGuru.events, 'addEventListener');

    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;

    route.setupSocketListeners();
    route.setupSocketListeners();
    route.setupSocketListeners();

    assert.ok(addEventListenerSpy.calledOnce, 'addEventListener called only once despite multiple setup calls');
  });

  test('willDestroy is idempotent', function(assert) {
    const mockSocketGuru = createMockSocketGuru();
    const removeEventListenerSpy = sinon.spy(mockSocketGuru.events, 'removeEventListener');

    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    run(() => {
      route.destroy();
      route.destroy();
    });

    assert.ok(removeEventListenerSpy.calledOnce, 'removeEventListener called only once');
  });

  test('destroying route without socketGuru does not throw', function(assert) {
    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);

    run(() => {
      route.destroy();
    });

    assert.ok(true, 'route destroyed without error');
  });

  test('activate sets up listeners automatically', function(assert) {
    const mockSocketGuru = createMockSocketGuru();
    const addEventListenerSpy = sinon.spy(mockSocketGuru.events, 'addEventListener');

    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;

    // Simulate route activation
    route.activate();

    assert.ok(addEventListenerSpy.calledOnce, 'listeners set up on activate');
    assert.equal(addEventListenerSpy.args[0][0], 'newEvent', 'listening to newEvent');
  });

  test('activate is idempotent when called multiple times', function(assert) {
    const mockSocketGuru = createMockSocketGuru();
    const addEventListenerSpy = sinon.spy(mockSocketGuru.events, 'addEventListener');

    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;

    route.activate();
    route.activate();
    route.activate();

    assert.ok(addEventListenerSpy.calledOnce, 'listeners set up only once');
  });

  test('_getEventMethod returns null for non-existent event', function(assert) {
    class TestRoute extends SocketEventHandlerRoute {
      socketActions = {
        existingEvent() {}
      };
    }

    const route = new TestRoute();
    setOwner(route, owner);

    const method = route._getEventMethod('nonExistentEvent');

    assert.equal(method, null, 'returns null for non-existent event');
  });

  test('_getEventMethod returns bound method for existing event', function(assert) {
    const testFn = function() {};
    class TestRoute extends SocketEventHandlerRoute {
      socketActions = {
        existingEvent: testFn,
      };
    }

    const route = new TestRoute();
    setOwner(route, owner);

    const method = route._getEventMethod('existingEvent');

    assert.ok(typeof method === 'function', 'returns a function');
    assert.ok(method !== testFn, 'returns a bound version of the original function');
  });

  test('socketActions can be null without errors', function(assert) {
    class TestRoute extends SocketEventHandlerRoute {
      socketActions = null;
    }

    const route = new TestRoute();
    setOwner(route, owner);

    const method = route._getEventMethod('anyEvent');

    assert.equal(method, null, 'returns null when socketActions is null');
  });

  test('onSocketAction can be null without errors', function(assert) {
    const mockSocketGuru = createMockSocketGuru();

    class TestRoute extends SocketEventHandlerRoute {
      onSocketAction = null;
    }

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    const event = new CustomEvent('newEvent', {
      detail: { eventName: 'testEvent', data: {} }
    });

    route._handleEvent(event);

    assert.ok(true, 'no error when onSocketAction is null');
  });

  // Memory Leak Prevention
  test('destroying route removes listener references', function(assert) {
    const mockSocketGuru = createMockSocketGuru();
    const removeEventListenerSpy = sinon.spy(mockSocketGuru.events, 'removeEventListener');

    class TestRoute extends SocketEventHandlerRoute {}

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    const boundHandler = route._boundHandleEvent;

    run(() => {
      route.destroy();
    });

    assert.ok(removeEventListenerSpy.calledOnce, 'removeEventListener was called');
    assert.equal(removeEventListenerSpy.args[0][0], 'newEvent', 'removed correct event');
    assert.equal(removeEventListenerSpy.args[0][1], boundHandler, 'removed correct handler');
  });

  // Async Handler Tests
  test('_handleEvent with socketActions returning a value', function(assert) {
    const mockSocketGuru = createMockSocketGuru();

    class TestRoute extends SocketEventHandlerRoute {
      socketActions = {
        testEvent() {
          return 'return value';
        }
      };
    }

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    const event = new CustomEvent('newEvent', {
      detail: { eventName: 'testEvent', data: {} }
    });

    const result = route._handleEvent(event);

    assert.equal(result, 'return value', 'returns value from handler');
  });

  test('_handleEvent with async socketActions', async function(assert) {
    const mockSocketGuru = createMockSocketGuru();

    class TestRoute extends SocketEventHandlerRoute {
      socketActions = {
        async testEvent() {
          return Promise.resolve('async result');
        }
      };
    }

    const route = new TestRoute();
    setOwner(route, owner);
    route.socketGuru = mockSocketGuru;
    route.setupSocketListeners();

    const event = new CustomEvent('newEvent', {
      detail: { eventName: 'testEvent', data: {} }
    });

    const result = await route._handleEvent(event);

    assert.equal(result, 'async result', 'handles async handlers');
  });
});
