/**
 * Verifies that the events array contains only non-empty strings
 * @param {Array} eventsArray - Array of event names
 * @returns {Boolean} true if valid, false otherwise
 */
const verifyArrayStructure = (eventsArray) => {
  if (!eventsArray.length) return false;
  return !eventsArray.some((el) => typeof el !== 'string' || el.trim() === '');
};

export { verifyArrayStructure };
