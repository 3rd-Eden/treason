const displayName = require('fn.name');
const React = require('react');

/**
 * Helper function that allows us to easily iterate over all stored modifier
 * functions and triggering them. All modifier functions follow the same
 * pattern where the first argument is data is getting modified and assumed
 * to return that value after modification.
 *
 * @param {Array} hooks Array of callbacks that need to be iterated.
 * @param {Mixed} returnValue returnvalue that can be overriden.
 * @param {Object} options Additional data/options for the modifier.
 * @returns {Mixed} The returnValue.
 * @private
 */
function trigger(hooks = [], returnValue, options) {
  for (var i = 0, l = hooks.length; i < l; i++) {
    returnValue = hooks[i](returnValue, options);
  }

  return returnValue;
}

/**
 * Cheating on React with JSON instead of Component Tree's
 *
 * @class Treason
 * @param {String} name Name of the property that stores the layout struct.
 * @public
 */
module.exports = class Treason {
  constructor(name = 'layout') {
    this.layout = name;
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
    middleware(this);
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
   * Generate unique keys for nested React component. The brilliance about this
   * generation is keys that are generated is actually xpath syntax. So when
   * you are debugging or inspecting a rendered component. You can easily
   * determine it's path/location in the tree by looking at the key, which is
   * a nice little detail.
   *
   * @param {String} prefix The root key, or prefix.
   * @returns {Function} generator(name)
   * @private
   */
  keygen(prefix) {
    const keys = {};

    return function generate(name) {
      if (!keys[name]) keys[name] = 1;
      else keys[name]++;

      return `${prefix}/${name}[${keys[name]}]`;
    };
  }

  /**
   * Transforms our Array based element details into a proper element.
   *
   * @param {Function} keygen Key generator for the elements.
   * @param {String} name Name of the component to create.
   * @param {Object} props Properties to apply to the component.
   * @param {Array} kids Children of the component.
   * @returns {Component} the createElement result.
   * @private
   */
  createElement(keygen, iterator, name, props, kids) {
    const treason = this;
    const Component = 'string' === typeof name
    ? (this._components.get(name) || name)
    : React.Fragment;

    if (Array.isArray(props) || 'string' === typeof props) {
      kids = props;
      props = {};
    }

    props = iterator(props, Component, kids);
    props.key = 'key' in props ? props.key : keygen(name || 'Fragment');

    //
    // We need to conditionally inject it children so we don't accidentally
    // populate the `props.children` of a component.
    //
    if ('string' === typeof kids) return React.createElement(Component, props, kids);
    if (!Array.isArray(kids)) return React.createElement(Component, props);

    return React.createElement(
      Component,
      props,

      kids.map(function mapKids(kiddo) {
        if (!kiddo) return kiddo;

        return treason.createElement(treason.keygen(props.key), iterator, ...kiddo)
      })
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
    const layout = data[this.layout];
    const keys = Object.keys(data);
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
    let elements = this.createElement(
      this.keygen('/treason'),
      function iterate(props = {}, Component, children) {
        return Object.keys(props).reduce(function eachProp(memo, prop) {
          const special = '@' === prop.charAt(0);
          const modifiers = modify.get(prop);

          if (!modifiers) return memo;

          memo[prop] = trigger(modifiers, props[prop], {
            data: special ? data[prop.slice(1)] : undefined,
            Component: Component,
            children: children,
            props: memo
          });

          //
          // The special keys are prefixed with `@`, they should never be passed
          // to the component so we delete them from the props as they should be
          // modifying the `props` object.
          //
          if (special) delete memo[prop];
          return memo;
        }, props);
      },
      ...layout
    );

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
