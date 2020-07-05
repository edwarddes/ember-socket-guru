import Component from '@ember/component';
import { set, get } from '@ember/object';

export default Component.extend({
  didReceiveAttrs() {
    this._super(...arguments);

    set(this, 'isSelected',
      this.route === this.label.toLowerCase());

    set(this, 'linkClass',
      this.isSelected ?
        'links-pane__link links-pane__link--selected' :
        'links-pane__link'
    );
  },
});
