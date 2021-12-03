'use strict';

module.exports = function (/* environment, appConfig */) {
  return {
    roadsignRegulationPlugin: {
      endpoint: 'http://localhost:8890/sparql',
      imageBaseUrl: 'https://dev.roadsigns.lblod.info',
    },
  };
};
