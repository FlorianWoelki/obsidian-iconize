import IconizePlugin from '@app/main';

export { AllIconsLoadedEvent } from '@lib/event/events';

export default interface IconizeAPI {
  version: {
    current: string;
  };
}

export function getApi(plugin: IconizePlugin): IconizeAPI {
  return {
    version: {
      get current() {
        return plugin.manifest.version;
      },
    },
  };
}
