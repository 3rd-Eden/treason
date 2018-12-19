const displayName = require('fn.name');
const React = require('react');

/**
 * Helper function that allows us to easily iterate over all stored modifier
 * functions and triggering them. All modifier functions follow the same
 * pattern where the first argument is data is getting modified and assumed
 * to return that value after modification.
 *
 * @param {Array} hooks Array of callbacks that need to be iterated.
 * @param {Mixed} returnvalue returnvalue that can be overriden.
 * @param {Object} options Additional data/options for the modifier.
 * @returns {Mixed} The returnvalue.
 * @private
 */
function trigger(hooks = [], returnvalue, options) {
  for (var i = 0, l = hooks.length; i < l; i++) {
    returnvalue = hooks[i](returnvalue, options);
  }

  return returnvalue;
}

/**
 * Cheating on React with JSON instead of Component Tree's
 *
 * @class Treason
 * @public
 */
module.exports = class Treason {
  constructor() {
    this._components = new Map();

    //
    // Methods that need to be pre-bound
    //
    ['createElement', 'register'].forEach((method) => {
      this[method] = this[method].bind(this);
    });

    //
    // Dynamically generate these methods as they all share the same function
    // signature that allows them to interact with the generated React elements.
    //
    ['before', 'after', 'modify'].forEach((method) => {
      const storage = `_${method}`;

      this[storage] = new Map();
      this[method] = function generated(name = '', fn) {
        const existing = this[storage].get(name);

        if (existing) this[storage].set(name, [...existing, fn]);
        else this[storage].set(name, [fn]);

        return this;
      }.bind(this);

      //
      // Restore the name to the generated prop name to make it easier to
      // debug when errors are happening as the stacktrace shows useful names.
      //
      this[method].displayName = method;
    });
  }

  /**
   * Registers a new middleware layer.
   *
   * @param {Function} middleware The middleware layer that needs to be called.
   * @public
   */
  use(middleware) {
    middleware({
      register: this.register,
      modify: this.modify,
      before: this.before,
      after: this.after
    });
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
  createElement(iterator, name, props, kids) {
    const Component = 'string' === typeof name
    ? (this._components.get(name) || name)
    : React.Fragment;

    if (Array.isArray(props)) {
      props = {};
      kids = props;
    }

    props = iterator(props, Component, kids);

    //
    // We need to conditionally inject it children so we don't accidentally
    // populate the `props.children` of a component.
    //
    if ('string' === typeof kids) return React.createElement(Component, props, kids);
    if (!Array.isArray(kids)) return React.createElement(Component, props);

    return React.createElement(
      Component,
      props,
      kids.map((kiddo) => this.createElement(iterator, ...kiddo))
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
    const modify = this._modify;
    const before = this._before;
    const after = this._after;

    keys.forEach(function eachBefore(key) {
      const hooks = before.get(key);
      if (!hooks) return;

      data[key] = trigger(hooks, data[key], layout);
    });

    //
    // Iterate over each Component/prop combination so we can apply additional
    // transformations if needed. By using `@` as a prefix for keys, it will
    // receive the matching dataset as reference.
    //
    const elements = this.createElement(function iterate(props = {}, Component, children) {
      return Object.keys(props).reduce(function eachProp(memo, prop) {
        const special = '@' === prop.charAt(0);
        const modifiers = modify.get(prop);

        if (modifiers) memo[prop] = trigger(modifiers, props[prop], {
          data: special ? data[prop.slice(1)] : undefined,
          Component,
          children,
          props,
        });

        return memo;
      }, props);
    }, ...layout);

    keys.forEach(function eachAfter(key) {
      const hooks = after.get(key);
      if (!hooks) return;

      elements = trigger(hooks, elements, data[key]);
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
    this._modify.clear();
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
