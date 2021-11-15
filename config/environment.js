'use strict';

module.exports = function (/* environment, appConfig */) {
  return {
    roadsignRegulationPlugin: {
      endpoint: 'https://roadsigns.lblod.info/sparql'
    }
  };
};
