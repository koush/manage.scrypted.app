/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@fortawesome/fontawesome-pro/css/fontawesome.min.css'
import '@xterm/xterm/css/xterm.css';

import '@mdi/font/css/materialdesignicons.css'
// import 'vuetify/styles'
import { aliases, fa } from 'vuetify/iconsets/fa'
import { mdi } from 'vuetify/iconsets/mdi'

import '../styles/fa/brands.css'
import '../styles/fa/light.css'
import '../styles/fa/solid.css'
import '../fonts/inter-4/inter.css'
import '../styles/quicksand.css'

import '../styles/theme.scss'

// Composables
import { createVuetify } from 'vuetify'

const customLightTheme = {
  colors: {
    background: '#dedede',
  },
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    themes: {
      'light': customLightTheme
    },
  },
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: {
      fa,
      mdi,
    }
  },
})
