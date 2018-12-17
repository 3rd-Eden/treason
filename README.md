# Treason

Cheating on React by using JSON. The idea is simple, instead of creating your
layout.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [register](#register)
  - [before](#before)
  - [after](#after)
  - [render](#render)
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

Now that the Treason instance is created you can register the components that
should be allowed to render.

```js
layout.register('MyComponent', MyComponent);
```

Now that we have components register a payload can be decoded so we can render
an output.

``js
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

const layout = new Treason();

layout
.register('Text', Text)
.register('View', View)
.register('Path', Path)
.register('Foo', foo);
```

Now that the we've registered the elements we want to allow in our view, we can
pass it some JSON to render.

```js

const view = layout.render(require('./path/to/file.json'));

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

layout.register('Example', Example);
```

The method returns it self so it can be used for chaining purposes.

### before

### after

### render

This method transforms your given JSON string, or object structure into the
actual React elements. It accepts a single argument:

- `data` The JSON string, or object that needs to be transformed into React
  Elements.

```js
layout.render(['ComponentName', { props: 'here' }]);
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

Below are some examples where the different use's and their outputs are
rendered.

```js
[{ foo: bar}, ["Example"]]
```

```js
<Fragment foo="bar">
  <Example />
</Fragment>
```

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
