import SocketGuruService from 'ember-socket-guru/services/socket-guru';

export default class SocketGuru extends SocketGuruService {
  config = {
    host: 'http://localhost:3000',
    namespace: '/my-namespace'
  };

  observedChannels = ['event1', 'event2'];
}
