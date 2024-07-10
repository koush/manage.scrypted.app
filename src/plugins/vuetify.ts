/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// import 'vuetify/styles'
import '../styles/theme.scss'

// Styles
import '@xterm/xterm/css/xterm.css';
import 'highlight.js/styles/github-dark.css';

import '@mdi/font/css/materialdesignicons.css'
import { aliases, fa } from 'vuetify/iconsets/fa'
import { mdi } from 'vuetify/iconsets/mdi'

import '../../scripts/font-awesome'

import '../fonts/inter-4/inter.css'
import '../styles/quicksand.css'


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
