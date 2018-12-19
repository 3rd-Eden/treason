const { it, describe, beforeEach, afterEach } = require('mocha');
const assume = require('assume');
const React = require('react');
const Treason = require('./');

describe('Treason', function () {
  let treason;

  function hello() {}
  function world() {}

  class Foo extends React.Component {
    render() {
      return null;
    }
  }

  class Bar extends React.Component {
    render() {
      return;
    }
  }

  beforeEach(function () {
    treason = new Treason();
  });

  afterEach(function () {
    treason.clear();
  });

  it('exported as function', function () {
    assume(Treason).is.a('function');
  });

  describe('#register', function () {
    it('registers a new component', function () {
      assume(treason._components.size).equals(0);

      treason.register('Foo', Bar);
      assume(treason._components.get('Foo')).equals(Bar);
    });

    it('registers a new component based on displayName', function () {
      assume(treason._components.size).equals(0);

      treason.register(Bar);
      assume(treason._components.get('Bar')).equals(Bar);
    });

    it('supports chaining', function () {
      assume(treason.register(Bar)).equals(treason);
    });

    it('can override existing components', function () {
      treason.register('Foo', Bar);
      assume(treason._components.get('Foo')).equals(Bar);

      treason.register('Foo', Foo);
      assume(treason._components.get('Foo')).equals(Foo);
    });
  });

  ['before', 'after', 'modify'].forEach(function each(method) {
    describe(`#${method}`, function () {
      it('registers a new function for a given key', function () {
        treason[method]('hello', hello);

        assume(treason[`_${method}`].get('hello')).deep.equals([hello]);
      });

      it('allows registering multiple functions for a given name', function () {
        treason[method]('hello', hello);
        treason[method]('hello', world);

        assume(treason[`_${method}`].get('hello')).deep.equals([hello, world]);
      });

      it('supports chaining', function () {
        assume(treason[method]('hello', hello)).equals(treason);
      });
    });
  });

  describe('#use', function () {
    it('a function', function () {
      assume(treason.use).is.a('function');
    });

    it('receives API methods', function (next) {
      treason.use(function use(methods) {
        assume(methods).does.not.equal(treason);
        assume(methods).is.a('object');

        assume(methods).is.length(4);
        assume(methods.register).equals(treason.register);
        assume(methods.before).equals(treason.before);
        assume(methods.after).equals(treason.after);
        assume(methods.modify).equals(treason.modify);

        next();
      });
    });
  });

  describe('#render', function () {
    beforeEach(function () {
      treason.register('Foo', Foo);
      treason.register('Bar', Bar);
    });

    it('returns React.createElement(Fragment) for { layout: [] }', function () {
      const res = treason.render({
        layout: []
      });

      assume(res).deep.equals(<React.Fragment />);
    });

    it ('parses stringified JSON', function () {
      const res = treason.render('{"layout":[]}');

      assume(res).deep.equals(<React.Fragment />);
    });

    it('renders a component with props', function () {
      const res = treason.render({
        layout: [ 'Foo', { foo: 'bar' } ]
      });

      assume(res).deep.equals(<Foo foo='bar' />)
    });

    it('triggers the before function `custom` with the payload', function (next) {
      treason.before('customname', function transform(data, layout) {
        assume(data).equals('custom payload');
        assume(layout).deep.equals(['Foo', { foo: 'bar' }]);

        next();
      });

      treason.render({
        customname: 'custom payload',
        layout: [ 'Foo', { foo: 'bar' } ]
      });
    });

    it('triggers the before `layout` function', function (next) {
      treason.before('layout', function transform(data, layout) {
        assume(layout).deep.equals(['Foo', { foo: 'bar' }]);
        assume(data).equals(layout);

        next();
      });

      treason.render({
        layout: [ 'Foo', { foo: 'bar' } ]
      });
    });
  });
});
