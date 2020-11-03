// Load all JavaScript extensions/polyfills
import Console from './console';
import './Date';
import './Error';
import './Intl';
import './Number';
import './String';

// hook our implementations to get loaded by require
import { register } from '../binding';
register('console', Console);
