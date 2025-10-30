# Changelog

## 2.0.0 (2025-01-XX)

### 🚨 BREAKING CHANGES

Version 2.0.0 is a complete rewrite focused on Socket.IO support with full Embroider compatibility.

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
- **[FEATURE]** Native ES6 class syntax support without workarounds
- **[FEATURE]** Direct Socket.IO client import (no dynamic lookup)
- **[FEATURE]** Simplified API focused on Socket.IO use cases
- **[FEATURE]** Socket.IO client v2.5.0 for backward compatibility with v2 servers

### 🐛 Bug Fixes

- **[BUGFIX]** Fixed Embroider compatibility issues with string-based client lookup
- **[BUGFIX]** Fixed ES6 class field initialization timing issues
- **[BUGFIX]** Fixed `_checkStructure()` assertion timing with ES6 classes
- **[BUGFIX]** Fixed synchronous property updates when using `set()`

### 🔧 Internal Changes

- Simplified service implementation by removing transport abstraction
- Removed dependency on ember-lodash (using native JavaScript)
- Updated all test files to use Socket.IO-only patterns
- Modernized build configuration for Embroider
- Removed all Bower dependencies
- Updated ESLint configuration to modern standards

### 📚 Documentation

- Completely rewritten README with modern examples
- Added comprehensive API reference
- Added migration guide from 1.x to 2.x
- Updated examples to use ES6 class syntax
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

   // After (2.x)
   export default class SocketService extends SocketGuruService {
     config = { host: '...', namespace: '...' };
     observedChannels = ['event1', 'event2'];
   }
   ```
3. **Remove `socketClient` property** - it's no longer needed
4. **Ensure `observedChannels` is an array** - object format is no longer supported
5. **Socket.IO server compatibility**: This version uses Socket.IO client v2.5.0 for backward compatibility with v2 servers. No server upgrade required.
6. **Update to Ember 4.0+** if you're on Ember 3.x
7. **Update to Node 14+** if you're on Node 12 or older

---

## 1.1.1 and earlier

See git history for changes in version 1.x releases.

### 1.1.1
- [BUGFIX] Fix the problem with instantiation of action cable client (#44), thanks @poteto!
- [BUGFIX] make sure to pass the options to underlying services (#43)
