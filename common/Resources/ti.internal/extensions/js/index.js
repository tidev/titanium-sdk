// Load all JavaScript extensions/polyfills
import Console from './console';
import './Error';

// hook our implementations to get loaded by require
import { register } from '../binding';
register('console', Console);
