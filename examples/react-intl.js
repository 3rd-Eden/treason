import { IntlProvider, FormattedMessage } from 'react-intl';
import Treason from 'treason';
import React from 'react';

const layout = new Treason();

layout.register('FormattedMessage', FormattedMessage);
layout.after('messages', function after(elements, messages) {
  return (
    <IntlProvider locale={ navigator.language } messages={ messages }>
      { elements }
    </IntlProvider>
  );
});

layout.render({
  messages: { foo: 'bar' },
  layout: [
    'p', [
      ['FormattedMessage', { id: 'foo' }]
    ]
  ]
});
