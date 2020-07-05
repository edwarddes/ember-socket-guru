import Component from '@ember/component';
import { computed, get } from '@ember/object';

export default Component.extend({
  isSelected: computed('selectedTechnology', function() {
    return get(this, 'technology.name') === get(this, 'selectedTechnology.name');
  }),

  technologyClass: computed('isSelected', function() {
    return this.isSelected ?
      'c-main-page__technology' :
      'c-main-page__technology c-main-page__technology--faded';
  }),

  click() {
    this.onClick(get(this, 'technology.name'));
  },
});
