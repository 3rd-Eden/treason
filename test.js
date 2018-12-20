const { it, describe, beforeEach, afterEach } = require('mocha');
const { shallow } = require('enzyme');
const assume = require('assume');
const React = require('react');
const Treason = require('./');

describe('Treason', function () {
  let treason;

  function hello() {}
  function world() {}

  class Foo extends React.Component {
    render() {
      return <div className={ this.props.className } />;
    }
  }

  class Bar extends React.Component {
    render() {
      return (
        <div className='bar'>
          { this.props.children }
        </div>
      );
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
        assume(methods).equals(treason);

        next();
      });
    });
  });

  describe('#keygen', function () {
    it('is a function', function () {
      assume(treason.keygen).is.a('function');
    });

    it('returns a key generator', function () {
      const gen = treason.keygen('foo');

      assume(gen).is.a('function');
    });

    it('generates keys with the given prefix', function () {
      const gen = treason.keygen('/treason');

      assume(gen('foo')).equals('/treason/foo[1]');
    });

    it('increases the counter for duplicate names', function () {
      const gen = treason.keygen('/treason');

      assume(gen('foo')).equals('/treason/foo[1]');
      assume(gen('foo')).equals('/treason/foo[2]');
      assume(gen('foo')).equals('/treason/foo[3]');
      assume(gen('bar')).equals('/treason/bar[1]');
      assume(gen('foo')).equals('/treason/foo[4]');
      assume(gen('bar')).equals('/treason/bar[2]');
    });

    it('can use the returned value to chain deeper unique keys', function () {
      const gen = treason.keygen('/treason');
      const foo = gen('foo');

      const foogen = treason.keygen(foo);
      assume(foogen('foo')).equals('/treason/foo[1]/foo[1]');
    });
  });

  describe('#render', function () {
    beforeEach(function () {
      treason.register('Foo', Foo);
      treason.register('Bar', Bar);
    });

    it('returns React.createElement(Fragment) for { layout: [] }', function () {
      const res = shallow(treason.render({
        layout: []
      }));

      assume(res.equals(<React.Fragment />)).is.true();
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

    it('can render text (string based children)', function () {
      const res = treason.render({
        layout: ['p', 'hello']
      });

      assume(res).deep.equals(<p>hello</p>);
    });

    it('allows modification of normal props', function () {
      treason.register('Foo', Foo);
      treason.modify('className', function (value, config) {
        assume(value).equals('hello');

        assume(config).is.a('object');
        assume(config.data).is.a('undefined');
        assume(config.Component).equals(Foo);
        assume(config.props).is.a('object');
        assume(config.props.className).equals(value);

        return 'yeah-this-is-now-modified';
      });

      const res = treason.render({
        layout: ['Foo', { className: 'hello' }]
      });

      assume(res).deep.equals(<Foo className='yeah-this-is-now-modified' />);
    });

    it('special @prefixed props receive matching data source', function () {
      treason.before('stylesheet', function (value) {
        assume(value).equals('this should be processed by before');

        return {
          foo: 'this-will-be-injected'
        };
      });

      treason.modify('@stylesheet', function (value, config) {
        assume(value).equals('foo');
        assume(config).is.a('object');
        assume(config.data).deep.equals({ foo: 'this-will-be-injected' });
        assume(config.Component).equals(Foo);
        assume(config.props).is.a('object');
        assume(config.props['@stylesheet']).equals(value);

        config.props.className = config.data[value];
        return undefined;
      });

      const res = treason.render({
        stylesheet: 'this should be processed by before',
        layout: ['Foo', { '@stylesheet': 'foo' }]
      });

      assume(res).deep.equals(<Foo className='this-will-be-injected' />);
    });

    it('can modify end result using the `after` method', function () {
      treason.after('layout', function (elements, data) {
        return (
          <div className='wrapper'>
            { elements }
          </div>
        );
      });

      const res = treason.render({
        layout: ['p', 'i hope this is wrapped']
      });

      assume(res).deep.equals(
        <div className='wrapper'>
          <p>i hope this is wrapped</p>
        </div>
      );
    });

    it('can render complex deeply nested structures', function () {
      treason.register('Foo', Foo);
      treason.register('Bar', Bar);

      const res = treason.render({
        layout: ['div', { className: 'container' }, [
          ['Foo'],
          ['Bar', [
            ['p', 'hello'],
            ['p', { id: 'custom-id' }, 'world']
          ]]
        ]]
      });

      assume(res).deep.equals(
        <div className='container'>
          <Foo />
          <Bar>
            <p>hello</p>
            <p id='custom-id'>world</p>
          </Bar>
        </div>
      );
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
