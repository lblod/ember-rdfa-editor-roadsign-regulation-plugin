'use strict';

module.exports = function (/* environment, appConfig */) {
  return {
    roadsignRegulationPlugin: {
      endpoint: 'https://dev.roadsigns.lblod.info/sparql',
      imageBaseUrl: 'https://register.mobiliteit.vlaanderen.be/',
    },
  };
};
