import Route from '@ember/routing/route';
import SocketEventHandler from 'ember-socket-guru/mixins/socket-event-handler';

export default Route.extend(SocketEventHandler, {
  socketActions: {
    onEvent1(data) {
      // catch all
    },
  },

  onSocketAction(eventName, eventData) {
    // handle the event
  },
});
