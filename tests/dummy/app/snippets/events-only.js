import SocketGuruService from 'ember-socket-guru/services/socket-guru';

export default class SocketGuru extends SocketGuruService {
  config = {
    host: 'http://localhost:3000',
    namespace: '/'
  };

  // Socket.IO uses array of event names
  observedChannels = ['event1', 'event2'];
}
