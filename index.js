import { registerRootComponent } from 'expo';

import App from './App';

// Import background task to ensure it's defined in global scope (Android only)
// This must be imported before the app is registered
import './src/app/utils/backgroundLocationTask';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
