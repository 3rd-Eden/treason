const { it, describe, beforeEach, afterEach } = require('mocha');
const assume = require('assume');
const React = require('react');
const Treason = require('./');

describe('Treason', function () {
  let treason;

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

      assume(res).deep.equals(React.createElement(React.Fragment, {}));
    });

    it ('parses stringified JSON', function () {
      const res = treason.render('{"layout":[]}');
      assume(res).deep.equals(React.createElement(React.Fragment, {}));
    });

    it('renders a component with props', function () {
      const res = treason.render({
        layout: [ 'Foo', { foo: 'bar' } ]
      });

      assume(res.type).equals(Foo);
      assume(res.props).deep.equals({ foo: 'bar' });
    });
  });
});
