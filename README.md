# ember-socket-guru

A modern Ember addon for easy integration of Socket.IO WebSockets into your Ember application with full Embroider support.

## Features

- 🚀 **Socket.IO Integration** - Seamless Socket.IO client integration
- ⚡ **Embroider Compatible** - Built for modern Ember with full Embroider support
- 🎯 **Simple API** - Clean, intuitive service-based API
- 🔌 **Auto-connect** - Optional automatic connection on service initialization
- 📡 **Event Management** - Dynamic event subscription and unsubscription
- 🧪 **Well Tested** - Comprehensive test coverage

## Version 2.0 Breaking Changes

Version 2.0 is a major rewrite that:
- **Removes support for Pusher, Phoenix Channels, and Action Cable** (Socket.IO only)
- **Requires Ember 4.0+** with full Embroider support
- **Fixes all Embroider compatibility issues** documented in v1.x
- **Simplifies the API** - no more transport selection, Socket.IO is built-in
- **Modernizes dependencies** - Updated to Socket.IO 4.x, Ember 5.x

If you need support for other WebSocket transports, please use version 1.x.

## Compatibility

* Ember.js v4.0 or above
* Ember CLI v4.0 or above
* Node.js v14 or above (v16 or v18 recommended)
* Socket.IO server v2.0 or above (client is v2.5.0 for backward compatibility)
* Requires ember-auto-import v2+ or Embroider for module resolution

## Installation

```bash
npm install ember-socket-guru
# or
yarn add ember-socket-guru
# or
pnpm add ember-socket-guru
```

### Socket.IO Version Compatibility

This package uses **Socket.IO client v2.5.0** for backward compatibility with Socket.IO v2 servers.

- ✅ **Socket.IO v2 servers**: Fully compatible (recommended)
- ⚠️ **Socket.IO v3/v4 servers**: Should work, but not extensively tested

**Future Upgrade Path**: When your Socket.IO servers are upgraded to v3 or v4, you can update the `socket.io-client` dependency in this package to match. Socket.IO v3+ introduced protocol breaking changes from v2, so ensure your backend is compatible before upgrading the client.

## Usage

### Basic Setup

Create a service that extends the `socket-guru` service:

```javascript
// app/services/socket.js
import SocketGuruService from 'ember-socket-guru/services/socket-guru';

export default class SocketService extends SocketGuruService {
  // Configuration for Socket.IO connection
  config = {
    host: 'http://localhost:3000',
    namespace: '/my-namespace'
  };

  // Array of event names to observe
  observedChannels = ['message', 'notification', 'update'];
}
```

### Using with ES6 Classes and Embroider

The addon is fully compatible with ES6 class syntax and Embroider:

```javascript
// app/services/socket.js
import SocketGuruService from 'ember-socket-guru/services/socket-guru';

export default class SocketService extends SocketGuruService {
  config = {
    host: 'http://localhost:3000',
    namespace: '/chat'
  };

  observedChannels = ['message', 'user-joined', 'user-left'];
}
```

### Configuration Options

#### `config` (Object, required)
Configuration object passed to Socket.IO client:

- `host` (String, required): The Socket.IO server URL
- `namespace` (String, required): The Socket.IO namespace to connect to

You can also pass any other [Socket.IO client options](https://socket.io/docs/v4/client-options/).

#### `observedChannels` (Array, required)
Array of event name strings to subscribe to:

```javascript
observedChannels = ['event1', 'event2', 'event3']
```

#### `autoConnect` (Boolean, optional, default: true)
Whether to automatically connect when the service is created:

```javascript
autoConnect = false; // Disable auto-connect
```

If `autoConnect` is `false`, you must manually call `setup()`:

```javascript
// Later in your code:
this.socket.setup();
```

### Listening to Events

The service uses Ember's `Evented` mixin, so you can listen to events using the `on` method:

```javascript
// app/components/chat-room.js
import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ChatRoomComponent extends Component {
  @service socket;

  constructor() {
    super(...arguments);
    this.socket.on('newEvent', this.handleSocketEvent);
  }

  willDestroy() {
    super.willDestroy();
    this.socket.off('newEvent', this.handleSocketEvent);
  }

  @action
  handleSocketEvent(eventName, data) {
    console.log(`Received event: ${eventName}`, data);

    if (eventName === 'message') {
      // Handle message event
    } else if (eventName === 'notification') {
      // Handle notification event
    }
  }
}
```

### Using the Socket Event Handler Mixin

For components, you can use the `SocketEventHandler` mixin for easier event handling:

```javascript
// app/components/chat-room.js
import Component from '@ember/component';
import SocketEventHandler from 'ember-socket-guru/mixins/socket-event-handler';
import { inject as service } from '@ember/service';

export default Component.extend(SocketEventHandler, {
  socket: service(),

  socketActions: {
    message(data) {
      // Handle message event
      console.log('New message:', data);
    },

    notification(data) {
      // Handle notification event
      console.log('New notification:', data);
    }
  }
});
```

### Emitting Events

To send events to the Socket.IO server:

```javascript
this.socket.emit('sendMessage', {
  text: 'Hello, world!',
  userId: 123
});
```

### Dynamic Event Management

You can add, remove, or update observed events at runtime:

```javascript
// Add new events to observe
this.socket.addObservedChannels(['new-event-1', 'new-event-2']);

// Remove an event
this.socket.removeObservedChannel('event-to-remove');

// Replace all observed events
this.socket.updateObservedChannels(['event-a', 'event-b']);
```

### Manual Connection Control

If you need more control over the connection lifecycle:

```javascript
// app/services/socket.js
import SocketGuruService from 'ember-socket-guru/services/socket-guru';

export default class SocketService extends SocketGuruService {
  autoConnect = false; // Don't connect automatically

  config = {
    host: 'http://localhost:3000',
    namespace: '/chat'
  };

  observedChannels = ['message'];

  connect() {
    this.setup();
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
```

Then in your application:

```javascript
// Connect manually when needed
this.socket.connect();

// Disconnect when done
this.socket.disconnect();
```

## API Reference

### Service Properties

- `config` (Object) - Socket.IO configuration
- `observedChannels` (Array) - Events to observe
- `autoConnect` (Boolean) - Auto-connect on init
- `client` (Object) - Socket.IO client instance (read-only)

### Service Methods

#### `setup()`
Initializes the Socket.IO connection and subscribes to events. Called automatically if `autoConnect` is `true`.

#### `emit(eventName, eventData)`
Emits an event to the Socket.IO server.

- `eventName` (String) - Name of the event to emit
- `eventData` (Any) - Data to send with the event

#### `addObservedChannels(events)`
Adds new events to observe.

- `events` (Array) - Array of event name strings to add

#### `removeObservedChannel(eventName)`
Removes an observed event.

- `eventName` (String) - Event name to remove

#### `updateObservedChannels(events)`
Replaces all observed events.

- `events` (Array) - New array of event name strings

### Events

The service triggers a `newEvent` event when a Socket.IO event is received:

```javascript
service.on('newEvent', (eventName, data) => {
  // Handle event
});
```

## Migration from 1.x

If you're migrating from ember-socket-guru 1.x:

### Breaking Changes

1. **Socket.IO Only**: Support for Pusher, Phoenix, and Action Cable has been removed
2. **No Socket Client Selection**: The `socketClient` property is removed (Socket.IO is always used)
3. **Array-Only Events**: `observedChannels` must always be an array (object format removed)
4. **Modern Ember**: Requires Ember 4.0+ and Node 14+
5. **ES6 Classes**: Full support for native ES6 class syntax
6. **Socket.IO Version**: Uses client v2.5.0 for backward compatibility (no server upgrade needed)

### Migration Steps

**Before (1.x):**
```javascript
export default SocketGuruService.extend({
  socketClient: 'socketio', // No longer needed
  config: { host: '...', namespace: '...' },
  observedChannels: ['event1', 'event2']
});
```

**After (2.x):**
```javascript
export default class SocketService extends SocketGuruService {
  config = { host: '...', namespace: '...' };
  observedChannels = ['event1', 'event2'];
}
```

The `socketClient` property is no longer needed as Socket.IO is the only supported transport.

### Embroider Compatibility

All Embroider compatibility issues from 1.x have been resolved:
- ✅ Direct Socket.IO client import (no string-based lookup)
- ✅ ES6 class field initialization works correctly
- ✅ No timing issues with structure validation
- ✅ Full static analysis compatibility

## Development

### Running Tests

```bash
npm test
```

### Running the Dummy Application

```bash
npm start
```

Visit your app at [http://localhost:4200](http://localhost:4200).

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).

## Credits

Originally created by [Jacek Bandura](mailto:jacek.bandura@netguru.pl) at [Netguru](https://github.com/netguru/ember-socket-guru).

Version 2.0 modernization focuses on Socket.IO support with full Embroider compatibility.
