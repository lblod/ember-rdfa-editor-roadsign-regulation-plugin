'use strict';

module.exports = {
  name: require('./package').name,
  isDevelopingAddon() {
    return this.app.env === 'development';
  },
};
