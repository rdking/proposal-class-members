// From https://github.com/tc39/proposal-static-class-features/issues/4

export const registry = new JSDOMRegistry();

export class JSDOM {
  let createdBy;

  let registerWithRegistry = () => {
    // ... elided ...
  }

  static async fromURL(url, options = {}) {
    normalizeFromURLOptions(options);
    normalizeOptions(options);

    const body = await getBodyFromURL(url);
    return finalizeFactoryCreated(new JSDOM(body, options), "fromURL");
  }

  static fromFile(filename, options = {}) {
    normalizeOptions(options);

    const body = await getBodyFromFilename(filename);
    return finalizeFactoryCreated(new JSDOM(body, options), "fromFile");
  }

  let static finalizeFactoryCreated = (jsdom, factoryName) => {
    jsdom::createdBy = factoryName;
    jsdom::registerWithRegistry(registry);
    return jsdom;
  }

  let static normalizeFromURLOptions = (options) => {
    if (options.referrer === undefined) {
      throw new TypeError();
    }
  }

  let static normalizeOptions = (options) => {
    if (options.url === undefined) {
      throw new TypeError();
    }
    options.url = (new URL(options.url)).href;
  }

}
