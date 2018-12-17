const displayName = require('fn.name');
const React = require('react');

/**
 * Cheating on React with JSON instead of Component Tree's
 *
 * @class Treason
 * @public
 */
module.exports = class Treason {
  constructor() {
    this.createElement = this.createElement.bind(this);
    this._components = new Map();
    this._before = new Map();
    this._after = new Map();
  }

  /**
   * Add a new middleware layer that is triggered before we transform the
   * structures.
   *
   * @param {String} name Name of the key it needs to trigger upon.
   * @param {Function} fn Callback that needs to trigger.
   * @returns {Treason}
   * @public
   */
  before(name, fn) {
    this._before.set(name.toLowerCase(), fn);

    return this;
  }

  /**
   * Add a new middleware layer that is triggered after we transform the
   * structures.
   *
   * @param {String} name Name of the key it needs to trigger upon.
   * @param {Function} fn Callback that needs to trigger.
   * @returns {Treason}
   * @public
   */
  after(name, fn) {
    this._after.set(name.toLowerCase(), fn);

    return this;
  }

  /**
   * Registers a new component for a given name.
   *
   * @param {String} name Name of the Component that needs to be registered.
   * @param {Component} Component the component to render for the given type.
   * @returns {Treason} Return self.
   * @public
   */
  register(name, Component) {
    if (name && Component) {
      this._components.set(name, Component);
    } else {
      this._components.set(displayName(name), name);
    }

    return this;
  }

  /**
   * Transforms our Array based element details into a proper element.
   *
   * @param {String} name Name of the component to create.
   * @param {Object} props Properties to apply to the component.
   * @param {Array} kids Children of the component.
   * @returns {Component} the createElement result.
   * @private
   */
  createElement(name, props, kids) {
    const Component = 'string' === typeof name
    ? (this._components.get(name) || name)
    : React.Fragment;

    if (Array.isArray(props)) {
      props = {};
      kids = props;
    }

    //
    // We need to conditionally inject it children so we don't accidentally
    // populate the `props.children` of a component.
    //
    if ('string' === typeof kids) return React.createElement(Component, props, kids);
    if (!Array.isArray(kids)) return React.createElement(Component, props);

    return React.createElement(
      Component,
      props,
      kids.map((kiddo) => this.createElement(...kiddo))
    );
  }

  /**
   * Transforms a given JSON structure into it's React Component Tree equiv.
   *
   * @param {Object} data The data structure that needs to be transformed.
   * @returns {Component} The transformed React tree.
   * @private
   */
  transform(data) {
    const keys = Object.keys(data);
    const layout = data.layout;
    const before = this._before;
    const after = this._after;

    keys.forEach(function eachBefore(key) {
      const fn = before.get(key);
      if (!fn) return;

      layout = fn(data[key], layout) || layout;
    });

    const elements = this.createElement(...layout);

    keys.forEach(function eachAfter(key) {
      const fn = after.get(key);
      if (!fn) return;

      elements = fn(data[key], elements) || elements;
    });

    return elements;
  }

  /**
   * Clear all internals.
   *
   * @public
   */
  clear() {
    this._components.clear();
    this._before.clear();
    this._after.clear();
  }

  /**
   * Parse a given string, or object tree into a React tree.
   *
   * @param {String} data JSON data string.
   * @returns {Component} The transformed React tree.
   */
  render(data) {
    return this.transform(
      'string' === typeof data
      ? JSON.parse(data)
      : data
    );
  }
}
