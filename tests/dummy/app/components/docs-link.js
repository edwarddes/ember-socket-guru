import Component from '@ember/component';
import { set, get } from '@ember/object';

export default Component.extend({
  didReceiveAttrs() {
    this._super(...arguments);

    set(this, 'isSelected',
      get(this, 'route') === get(this, 'label').toLowerCase());

    set(this, 'linkClass',
      get(this, 'isSelected') ?
        'links-pane__link links-pane__link--selected' :
        'links-pane__link'
    );
  },
});
