import './bootstrap';
import './navigation-functions';
import { Charts } from './chart-manager';

import Alpine from 'alpinejs';

window.Alpine = Alpine;
window.Charts = Charts;

Alpine.start();
