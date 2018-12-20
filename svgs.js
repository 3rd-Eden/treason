const svgs = require('svgs');

/**
 * Plugin for svgs, registers all possible components with the
 * treason instance.
 *
 * @param {Object} treason Plugin API interface.
 * @public
 */
module.exports = function plugin(treason) {
  [
    'Circle',
    'ClipPath',
    'Defs',
    'Ellipse',
    'G',
    'Image',
    'Line',
    'LinearGradient',
    'Mask',
    'Path',
    'Pattern',
    'Polygon',
    'Polyline',
    'RadialGradient',
    'Rect',
    'Stop',
    'Svg',
    'Symbol',
    'TSpan',
    'Text',
    'TextPath',
    'Use'
  ].forEach(function register(name) {
    treason.register(name, ReactNative[name]);
  });
};
