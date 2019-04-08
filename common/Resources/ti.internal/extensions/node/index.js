// Load all the node compatible core modules
import './process';
import path from './path';
import os from './os';
import tty from './tty';
import util from './util';
import assert from './assert';

// hook our implementations to get loaded by require
import { bindObjectToCoreModuleId } from '../binding';
bindObjectToCoreModuleId('path', path);
bindObjectToCoreModuleId('os', os);
bindObjectToCoreModuleId('tty', tty);
bindObjectToCoreModuleId('util', util);
bindObjectToCoreModuleId('assert', assert);
