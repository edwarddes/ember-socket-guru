import SocketEventHandlerRoute from 'ember-socket-guru/bases/socket-event-handler-route';

export default class MyRoute extends SocketEventHandlerRoute {
  socketActions = {
    singleEvent(data) {
      // Handle this specific event
      console.log('Single event received:', data);
    },
  };
}
