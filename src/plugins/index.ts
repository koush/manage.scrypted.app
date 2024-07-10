/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import router from './router';

// v-calendar
import { setupCalendar, Calendar, DatePicker } from 'v-calendar';
import 'v-calendar/style.css';


// Types
import type { App } from 'vue'

export function registerPlugins(app: App) {
  app.use(vuetify);
  app.use(router);

  // Use plugin defaults (optional)
  app.use(setupCalendar, {});
  // Use the components
  app.component('V2Calendar', Calendar)
  app.component('V2DatePicker', DatePicker)
}
