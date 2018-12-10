import Route from '@ember/routing/route';

export default Route.extend(SocketEventHandler, {
  onSocketAction(eventName) {
    // do something
  },
});
