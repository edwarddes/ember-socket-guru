import SocketEventHandlerRoute from 'ember-socket-guru/bases/socket-event-handler-route';

export default class MyRoute extends SocketEventHandlerRoute {
  socketActions = {
    onEvent1(data) {
      // handle specific event
    },
  };

  onSocketAction(eventName, eventData) {
    // catch-all for all events
    console.log(`Received ${eventName}:`, eventData);
  }
}
