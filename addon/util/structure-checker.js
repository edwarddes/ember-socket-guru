import { isArray } from '@ember/array';
import { typeOf } from '@ember/utils';

const verifyArrayStructure = (eventsArray) => {
  if (!eventsArray.length) return false;
  return !eventsArray.some((el) => typeOf(el) !== 'string');
};

const verifyObjectStructure = (observedChannels) => {
  if (!Object.keys(observedChannels).length) return false;

  return !Object.values(observedChannels)
    .some(eventsArray => !isArray(eventsArray) || !verifyArrayStructure(eventsArray));
};

export { verifyObjectStructure, verifyArrayStructure };
