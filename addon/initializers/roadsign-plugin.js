import RoadSignRegulationPlugin from '../roadsign-regulation-plugin';

function pluginFactory(plugin) {
  return {
    create: (initializers) => {
      const pluginInstance = new plugin();
      Object.assign(pluginInstance, initializers);
      return pluginInstance;
    },
  };
}

export function initialize(application) {
  application.register(
    'plugin:roadsign-regulation',
    pluginFactory(RoadSignRegulationPlugin),
    { singleton: false }
  );
}

export default {
  initialize,
};
