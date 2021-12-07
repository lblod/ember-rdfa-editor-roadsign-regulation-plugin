'use strict';

module.exports = function (/* environment, appConfig */) {
  return {
    roadsignRegulationPlugin: {
      endpoint: 'https://dev.gelinkt-notuleren.lblod.info/sparql',
      imageBaseUrl: 'https://dev.roadsigns.lblod.info',
    },
  };
};
