const ReactNative = require('react-native');

/**
 * Plugin for React-Native, registers all possible components with the
 * treason instance.
 *
 * @see node_modules/react-native/Libraries/react-native/react-native-implementation.js
 * @param {Object} treason Plugin API interface.
 * @public
 */
module.exports = function plugin(treason) {
  [
    'ActivityIndicator',
    'Button',
    'CheckBox',
    'DatePickerIOS',
    'DrawerLayoutAndroid',
    'FlatList',
    'Image',
    'ImageBackground',
    'InputAccessoryView',
    'KeyboardAvoidingView',
    'ListView',
    'MaskedViewIOS',
    'Modal',
    'NavigatorIOS',
    'Picker',
    'PickerIOS',
    'ProgressBarAndroid',
    'ProgressViewIOS',
    'RefreshControl',
    'SafeAreaView',
    'ScrollView',
    'SectionList',
    'SegmentedControlIOS',
    'Slider',
    'SnapshotViewIOS',
    'StatusBar',
    'SwipeableFlatList',
    'SwipeableListView',
    'Switch',
    'TabBarIOS',
    'TabBarIOS.Item',
    'Text',
    'TextInput',
    'ToolbarAndroid',
    'Touchable',
    'TouchableHighlight',
    'TouchableNativeFeedback',
    'TouchableOpacity',
    'TouchableWithoutFeedback',
    'View',
    'ViewPagerAndroid',
    'VirtualizedList',
    'WebView'
  ].forEach(function register(name) {
    treason.register(name, ReactNative[name]);
  });
};
