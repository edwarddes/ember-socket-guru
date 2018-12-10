import Route from '@ember/routing/route';

export default Route.extend(SocketEventHandler, {
  socketActions: {
    singleEvent(data) {
      // do something
    },
  },
});
