import Route from '@ember/routing/route';
import { get } from '@ember/object';

export default Route.extend({
  model(params, model) {
    return {
      routeName: get(this, 'routeName').split('.')[1].replace(/-/g, ' '),
      technology: model.resolvedModels.technology,
    };
  },
});
