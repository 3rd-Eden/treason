# Treason

Treason, that's how it feels when you cheat on React by using JSON instead of
JSX. This allows you to easily an API, or external source to generate your
views. Possibilities are endless.

So how does this work, we iterate over your supplied JSON payload, look for the
`layout` key and iterate the array, creating new elements using
`React.createElement`. To support deeply nested structures we automatically
generate the required `key` properties, or you supply them your self in as
props for the components. To fully unlock all potential of this module we allow
you modify every step of the process using various of helper methods. Want to
use a stylesheet object instead of style props? Easy mode. Wrapping the app
with Redux store? No problem. Custom components, React-Native? Yep, all
supported.

Take a look at our [examples](/examples) folder for some usage patterns.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [register](#register)
  - [use](#use)
  - [before](#before)
  - [after](#after)
  - [modify](#modify)
  - [render](#render)
  - [clear](#clear)
- [JSON](#json)

## Installation

The package is released in the public npm registry and can be installed by
running:

```
npm install --save treason
```

## Usage

The `treason` module exposes the `Treason` class which you need to initialize.

```js
import Treason from 'treason';

const layout = new Treason();
```

The `treason` instance allows a single optional argument:

- `layout` The property that of the supplied JSON that stores the layout
  structure according to our [JSON](#JSON) specification. Defaults to `layout`.

Now that the Treason instance is created you can register the components that
should be allowed to render.

```js
layout.register('MyComponent', MyComponent);
```

Now that we have components register a payload can be decoded so we can render
an output.

```js
const view = layout.render(require('./you/json/payload.json'));
console.log(view);
```

And that it, your JSON payload is now rendered and stored in the `view`
variable. So for a more complete picture, here's it all together:

```js
import { Text, View, ScrollView } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { Foo, Bar, Loading } from './components';
import React, { Component } from 'react';
import Treason from 'treason';

const treason = new Treason();

treason
.register('Text', Text)
.register('View', View)
.register('Path', Path)
.register('Foo', foo);
```

Now that the we've registered the elements we want to allow in our view, we can
pass it some JSON to render.

```js
const view = treason.render(require('./path/to/file.json'));

<Container>
  { view }
</Container>
```

But we can take it a step further, so why not load the JSON file from a remote
service:

```js
class Main extends Component {
  constructor() {
    super(...arguments);

    this.state = {
      view: null
    };
  }

  componentDidMount() {
    fetch('http://api.endpoint.here').then((data) => {
      this.setState({ view: layout.parse(data) });
    });
  }

  render() {
    if (!this.state.view) return <Loading />

    return this.state.view;
  }
}
```

Now you have on the fly updating of your app's layout.

## API

- [register](#register)
- [use](#use)
- [before](#before)
- [after](#after)
- [modify](#modify)
- [render](#render)
- [clear](#clear)

### register

Registers a new custom component that can be rendered by the JSON structure. The
method accepts 2 arguments:

- `name` Name of the component in which it's addressed in the JSON structure.
- `Component` The component that should be inserted.

```js
class Example extends React.Component {
  render() {
    return <p>This is an example</p>
  }
}

treason.register('Example', Example);
```

The method returns it self so it can be used for chaining purposes.

### use

The supplied function will receive the plugin API that will give authors
access to the following methods:

- [`register`](#register)
- [`modify`](#modify)
- [`before`](#before)
- [`after`](#after)
- [`use`](#use)

```js
treason.use(require('./your-custom-plugin-here'));

treason.use(function (api) {
  // api.register();
  // api.modify();
  // api.before();
  // api.after();
});
```

The `treason` library ships with the following plugins by default:

- `treason/svgs` The `svgs` library allows you to create Svgs that work in React
  and React-Native. This plugin will register all components so they can be used
  by the layout.
- `treason/react-native` Registers all available components that are exposed by
  the `react-native` library.

```js
treason.use(require('treason/svgs'));
```

### modify

The `modify` functions allows you to transform specific properties. It requires
the following properties:

- `prop` The name of the property that needs to be intercepted.
- `callback` Function that is invoked when the given property is encountered.

The `callback` receives the following arguments:

- `value` The value of the property.
- `config` An object with some additional information on where it's encountered
  - `Component`: The component that is being rendered with the property.
  - `props`: Reference to all props on the component.
  - `children`: Children of the `Component`.
  - `data`: Only set when you use the special `@` syntax.

The callback should `return` the new value for the property.

For example to prevent the `dangerouslySetInnerHTML` from being used as
property on any of the components, you could forcefully remove it by modifying
the value from the HTML payload to `undefined`:

```js
treason.modify('dangerouslySetInnerHTML', function modify(value, config) {
  return undefined;
});
```

The `modify` function allows you to reference the additional data structures
that you've send together with your `layout` payload. You can reference this
data by prefixing the name of the properties with an `@`.

Because these properties are references data structures that were received in
the JSON structure they will be removed automatically after they have been
encountered in the `props` of the component.

```js
treason.modify('@style', function modify(value, config) {
  // config.props
  // config.Component
  // config.children
  // config.data

  config.props.style = config.style[value];
});

treason.render({
  style: { /* this will be set as config.data in the function above */ },
  layout: ['div' { '@style': 'hello' }, [
    ['div', { '@style': 'hello' }]
  ]]
});
```

In the example above, the `@style` modifier will be called for the `div`, and
receive `hello` as value. The `config.data` is propagated with the contents of
the `style` property of the JSON payload that you supplied to `treason.render`.

So in this example we're re-using a single `style` object instead of having to
supply the same style information multiple times in the JSON structure. Allowing
you to create a smaller and more efficient payload.

But we can do better, you can combine this with the [`before`](#before) method
that will pre-process the referenced `style` object. So if you where to do this
on React-Native, you could transform the `style` into a `StyleSheet` instance:

```js
import { StyleSheet } from 'react-native';

treason.before('style', function (payload) {
  return StyleSheet.create(payload);
});
```

### before

Pre-process the data in the JSON.

- `name` The name of the property in the initial JSON payload.
- `callback` Function that is invoked when the given property is encountered.

The `callback` receives the following arguments:

- `data` Data that the `name` referenced in the JSON payload.
- `layout` The layout structure **before** they are transformed into React
  elements.

The callback should `return` the payload that you received as first argument.
Anything that you return will be now used as value.

```js
import { createStore } from 'redux';
import reducer from './reducer';

treason.before('store', function before(data, layout) {
  const store = createStore(reducer, data);

  return store;
});
```

**PRO TIP:** As the layout is stored with a `layout` key, you also modify that
when it's received:

```js
treason.before('layout', function before(data, layout) {
  //
  // data == layout, as we're pre-processing the `layout` key from the
  // supplied JSON payload. But we can now modify the whole JSON structure,
  // add, remove elements as you wish. So in this case, we're going to
  // wrap the received elements in a `<div class="container">` element.
  //
  return ['div', { className: 'container' }, layout];
});
```

### after

Allows you to apply any additional post processing after the layout has been
transformed into React elements. The method requires 2 arguments:

- `name` The name of the property in the initial JSON payload.
- `callback` Function that is invoked when the given property is encountered.

The `callback` receives the following arguments:

- `elements` The rendered React Elements tree.
- `data` Data that the `name` referenced in the JSON payload.

The callback should `return` the React Elements tree, or a new modified tree:

```js
treason.after('messages', function after(elements, messages) {
  return (
    <IntlProvider locale={ navigator.language } messages={ messages }>
      { elements }
    </IntlProvider>
  );
});

treason.render({ messages: {}, layout: ['Foo'] });
```

In the example above we have our React Intl messages stored as `messages` key
in the initial payload, so after the elements are transformed we wrap the
generated React Tree and pass it the initial messages payload.

**PRO TIP:*** Just like the `before` method, you can also process the `layout`
key and apply additional transformation to the elements tree.

### render

This method transforms your given JSON string, or object structure into the
actual React elements. It accepts a single argument, the JSON string, or object
that needs to be transformed into React Elements. It should have a `layout` key
that follows our [JSON](#JSON) structure specification. Additional keys may be
supplied as their content can be referenced using the `before`, `after` and
`modify` functions.

It's a **synchronous** process so the method will return created elements:

```js
const elements = layout.render({
  layout: ['ComponentName', { props: 'here' }]
});
```

As it's returning React Element's it can be used inside components as well.

```js
class Ads extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      view: null
    };
  }

  componentDidMount() {
    fetch('https://my.ads.server/treason').then(function parse(response) {
      return response.json();
    })
    .then(function update(myJson) {
      this.setState({ view: treason.render(myJson) });
    });
  }

  render() {
    if (!this.state.view) return <div className="placeholder" />

    return (
      <div className="ads">
        { this.state.view }
      </div>
    )
  }
}
```

**Word of caution** Your JSON, your problem, we do not sanitize your data. Any
of the registered components as well as normal elements can be rendered through
the payload so **do not allow user input as JSON/layout values**.

### clear

Clear the instance of all of it's registered components and before, after,
use, modify functions.

```js
treason.clear();
```

## JSON

The JSON structure is simple and straightforward. The root element of the JSON
structure should be an object, with a key `layout`. The layout should contain
the layout that destructured as `Array`

```js
{
  layout: []
}
```

```js
["ComponentName", { props: "here" }, [
  // children of the ComponentName
  ["ChildComponent", { props: "foo"} ],
  ["AnotherChild", { props: "bar"}]
]]
```

1. First item is the name of the component that needs to be rendered. This name
   should correspond to the name that you specified in the [register](#register)
   method. If the first item is not a string, we will assume that it's `Fragment`
   that needs to be rendered.
2. Next item is an object with the props that should be applied to the specified
   component. This object can omitted if there are no props to apply.
3. Last item is an array of children that needs to be rendered within the
   component. This array should have children that are specified in exactly the
   same way as the parent component.

If you are familiar with [AssetSystem], it uses the same structure. Below are
some examples where the different use's and their outputs are rendered.

**INPUT:**
```js
[{ foo: bar}, ["Example"]]
```

**OUTPUT:**
```js
<Fragment foo="bar">
  <Example />
</Fragment>
```

**INPUT:**
```js
['Svg', [
  ["Rect", { height: 100, width: 100, fillColor: "red" }],
  ["Path", { d: "17n098d" }],
  ["G", [
    ["Circle", { x: 0, y: 0 }],
    ["Circle", { x: 0, y: 10 }]
  ]]
]]
```

**OUTPUT:**
```js
<Svg>
  <Rect height={ 100 } width={ 100 } fillColor="red" />
  <Path d="17n098d" />
  <G>
    <Circle x={ 0 } y={ 0 } />
    <Circle x={ 0 } y={ 10 } />
  </G>
</Svg>
```

You can go as deep as you want with the structures, supply as many props as
want.

## License

[MIT](LICENSE)

[AssetSystem]: https://github.com/godaddy/asset-system/blob/master/SPECIFICATION.md
