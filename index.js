// Polyfills: Must be at the top
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Entry point
import { registerRootComponent } from 'expo';
import App from './App';

// Register the root component
registerRootComponent(App);
