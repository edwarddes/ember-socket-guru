import Controller from '@ember/controller';
import { computed, set, get } from '@ember/object';
import { run } from '@ember/runloop';

/* eslint-disable netguru-ember/alias-model-in-controller */
export default Controller.extend({
  technologies: [{
    name: 'Phoenix Channels',
    img: 'phoenix-icon.png',
    position: 1,
    url: 'phoenix',
  }, {
    name: 'Socket.io',
    img: 'socket-io-icon.png',
    position: 2,
    url: 'socketio',
  }, {
    name: 'ActionCable',
    img: 'action-cable-icon.png',
    position: 3,
    url: 'action-cable',
  }, {
    name: 'Pusher',
    img: 'pusher-icon.png',
    position: 4,
    url: 'pusher',
  }],

  isIncrementing: true,

  selectedTechnology: computed('technologies', function() {
    return this.technologies[1];
  }),

  upperTechnologies: computed('selectedTechnology', function() {
    const selectedTechnology = this.selectedTechnology;

    return this.technologies.filter((technology) => {
      return technology.position < selectedTechnology.position;
    });
  }),

  lowerTechnologies: computed('selectedTechnology', function() {
    const selectedTechnology = this.selectedTechnology;

    return this.technologies.filter((technology) => {
      return technology.position > selectedTechnology.position;
    });
  }),

  actions: {
    selectTechnology(name) {
      const technology = this.technologies
        .filter(item => item.name === name)[0];

      set(this, 'selectedTechnology', technology);
    },

    onGetStartedClick() {
      this.transitionToRoute(
        'technology.installation',
        get(this, 'selectedTechnology.url')
      );
    },
  },

  init() {
    this._animateTechnologies();
  },

  _animateTechnologies() {
    run.later(() => {
      const selectedTechnology = this.selectedTechnology;
      const technologies = this.technologies;
      const position = technologies.indexOf(selectedTechnology);

      if (position === (technologies.length - 1)) {
        set(this, 'isIncrementing', false);
      } else if (position === (0)) {
        set(this, 'isIncrementing', true);
      }

      const next = this.isIncrementing ? position + 1 : position - 1;

      set(this, 'selectedTechnology', technologies[next]);
      this._animateTechnologies();
    }, 3000);
  },
});
