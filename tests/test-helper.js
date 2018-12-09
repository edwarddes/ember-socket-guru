<<<<<<< HEAD
import {
  setResolver,
} from 'ember-qunit';
import resolver from './helpers/resolver';
=======
import Application from '../app';
import config from '../config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';
>>>>>>> 54539cc... message

setApplication(Application.create(config.APP));

start();
