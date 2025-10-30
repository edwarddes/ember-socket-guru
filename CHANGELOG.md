# Changelog

## 3.0.0 (2025-01-XX)

### 🚨 BREAKING CHANGES

Version 3.0.0 is a complete ES6 modernization of the codebase. **This version requires v2.0.0 features** (Socket.IO only, Embroider support).

#### ES6 Modernization
- **[BREAKING]** All code converted from `.extend()` to ES6 classes
- **[BREAKING]** Event handling changed from Ember's `Evented` to native `EventTarget`
- **[BREAKING]** Event data structure changed - now in `event.detail` object
- **[BREAKING]** `SocketEventHandler` mixin deprecated - use `SocketEventHandlerRoute` base class
- **[BREAKING]** Socket client instantiation changed from `.create()` to `new SocketIOClient()`
- **[BREAKING]** Removed all `get()`/`set()` usage - use native property access
- **[BREAKING]** Service uses `constructor()` instead of `init()` for auto-connect

### ✨ New Features

- **[FEATURE]** Complete ES6 class syntax throughout the codebase
- **[FEATURE]** Native `EventTarget` for event handling (modern browser API)
- **[FEATURE]** Added `SocketEventHandlerRoute` base class to replace mixin pattern
- **[FEATURE]** Uses `@service` decorator instead of `inject()`
- **[FEATURE]** Native property access throughout (no Ember get/set)
- **[FEATURE]** Plain ES6 class for Socket.IO client (no EmberObject)

### 🔧 Internal Changes

- Converted all `.extend()` calls to ES6 classes
- Replaced `get()`/`set()` with native property access everywhere
- Replaced `getProperties()`/`setProperties()` with destructuring/assignment
- Replaced `typeOf` with native `typeof`
- Replaced `inject()` with `@service` decorator
- Replaced `Evented` mixin with native `EventTarget`
- Converted `SocketEventHandler` mixin to `SocketEventHandlerRoute` base class
- Removed dependency on `@ember/object` methods (get/set/getProperties/setProperties)
- Removed dependency on `@ember/utils` (typeOf)
- Updated all test files to use ES6 syntax and EventTarget
- Updated all documentation examples to use ES6 classes

### 📚 Documentation

- Updated README with ES6 class examples
- Updated all code examples to use EventTarget API
- Added migration guide from 2.x to 3.x
- Documented base class pattern for event handling

### Migration from 2.x

If you're upgrading from ember-socket-guru 2.x:

1. **Update event listeners** to use EventTarget API:
   ```javascript
   // Before (2.x)
   this.socketGuru.on('newEvent', (eventName, data) => {
     console.log(eventName, data);
   });

   // After (3.0)
   this.socketGuru.events.addEventListener('newEvent', (event) => {
     const { eventName, data } = event.detail;
     console.log(eventName, data);
   });
   ```

2. **Update route event handlers** to use base class instead of mixin:
   ```javascript
   // Before (2.x - using deprecated mixin)
   import SocketEventHandler from 'ember-socket-guru/mixins/socket-event-handler';
   export default Route.extend(SocketEventHandler, {
     socketActions: {
       message(data) { /* ... */ }
     }
   });

   // After (3.0)
   import SocketEventHandlerRoute from 'ember-socket-guru/bases/socket-event-handler-route';
   export default class MyRoute extends SocketEventHandlerRoute {
     socketActions = {
       message(data) { /* ... */ }
     };
   }
   ```

3. **If you're instantiating Socket.IO client directly** (rare):
   ```javascript
   // Before (2.x)
   const client = SocketIOClient.create();

   // After (3.0)
   const client = new SocketIOClient();
   ```

---

## 2.0.0 (2025-01-XX)

### 🚨 BREAKING CHANGES

Version 2.0.0 simplifies the addon to Socket.IO only with full Embroider compatibility.

#### Removed Features
- **[BREAKING]** Removed support for Pusher, Phoenix Channels, and Action Cable transports
- **[BREAKING]** Removed `socketClient` property (Socket.IO is now the only transport)
- **[BREAKING]** Removed object-based `observedChannels` format (array-only now)
- **[BREAKING]** Removed socket client lookup mechanism
- **[BREAKING]** Removed Bower support (npm/yarn/pnpm only)
- **[BREAKING]** Removed `verifyObjectStructure` utility
- **[BREAKING]** Removed `channelsDiff`, `fetchEvents` utilities

#### Dependency Updates
- **[BREAKING]** Updated to Ember 4.0+ (dropped Ember 3.x support)
- **[BREAKING]** Updated to Node 14+ (dropped Node 10-12 support)
- Updated to Socket.IO client 2.5.0 (from 2.3.1) - kept at v2 for backward compatibility with v2 servers
- **[BREAKING]** Updated to ember-auto-import 2.x (from 1.x)
- **[BREAKING]** Updated to ember-cli-babel 8.x (from 7.x)

#### API Changes
- **[BREAKING]** `observedChannels` must now be an array of strings (no objects)
- **[BREAKING]** Removed `socketClient` configuration (always uses Socket.IO)
- **[BREAKING]** Error messages updated to reference "events" instead of "channels"

### ✨ New Features

- **[FEATURE]** Full Embroider support and compatibility
- **[FEATURE]** Direct Socket.IO client import (no dynamic lookup)
- **[FEATURE]** Simplified API focused on Socket.IO use cases
- **[FEATURE]** Socket.IO client v2.5.0 for backward compatibility with v2 servers
- **[FEATURE]** V2 addon format with proper exports field

### 🐛 Bug Fixes

- **[BUGFIX]** Fixed Embroider compatibility issues with string-based client lookup
- **[BUGFIX]** Fixed ES6 class field initialization timing issues
- **[BUGFIX]** Fixed `_checkStructure()` assertion timing with ES6 classes

### 🔧 Internal Changes

- Simplified service implementation by removing transport abstraction
- Modernized build configuration for Embroider with v2 addon format
- Added proper "exports" field to package.json for v2 addon
- Removed all Bower dependencies

### 📚 Documentation

- Completely rewritten README for Socket.IO only
- Added comprehensive API reference
- Added migration guide from 1.x to 2.x
- Documented all Embroider compatibility improvements

### Migration from 1.x

If you're upgrading from ember-socket-guru 1.x:

1. **If you use Pusher, Phoenix, or Action Cable**: Stay on version 1.x or migrate to Socket.IO

2. **Update your service definition**:
   ```javascript
   // Before (1.x)
   export default SocketGuruService.extend({
     socketClient: 'socketio',
     config: { host: '...', namespace: '...' },
     observedChannels: ['event1', 'event2']
   });

   // After (2.0)
   export default SocketGuruService.extend({
     config: { host: '...', namespace: '...' },
     observedChannels: ['event1', 'event2']
   });
   ```

3. **Remove `socketClient` property** - it's no longer needed

4. **Ensure `observedChannels` is an array** - object format is no longer supported:
   ```javascript
   // Before (1.x - for Pusher/Phoenix)
   observedChannels: {
     channel1: ['event1', 'event2']
   }

   // After (2.0 - Socket.IO only)
   observedChannels: ['event1', 'event2']
   ```

5. **Socket.IO server compatibility**: This version uses Socket.IO client v2.5.0 for backward compatibility with v2 servers. No server upgrade required.

6. **Update to Ember 4.0+** if you're on Ember 3.x

7. **Update to Node 14+** if you're on Node 12 or older

---

## 1.1.1 and earlier

See git history for changes in version 1.x releases.

### 1.1.1
- [BUGFIX] Fix the problem with instantiation of action cable client (#44), thanks @poteto!
- [BUGFIX] make sure to pass the options to underlying services (#43)
