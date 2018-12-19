import { StyleSheet, View } from 'react-native';
import Treason from 'treason';
import React from 'react';

const layout = new Treason();
layout.register('View', View);

layout.before('stylesheet', function before(payload) {
  return StyleSheet.create(payload);
});

layout.modify('@stylesheet', function modify(ref, config) {
  return config[ref];
});

layout.render({
  stylesheet: {
    square: {
      backgroundColor: 'red',
      height: 100,
      width: 100
    }
  },

  layout: ['View', { '@stylesheet':'square' } ]
});
