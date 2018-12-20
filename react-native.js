const ReactNative = require('react-native');

/**
 * Plugin for React-Native, registers all possible components with the
 * treason instance.
 *
 * @param {Object} treason Plugin API interface.
 * @public
 */
module.exports = function plugin(treason) {
  [
    'ActivityIndicator',
    'Button',
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
    'Switch',
    'TabBarIOS',
    'TabBarIOS.Item',
    'Text',
    'TextInput',
    'ToolbarAndroid',
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
