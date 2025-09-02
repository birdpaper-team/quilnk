import { createApp } from 'vue'
import App from './App.vue'
import './style.scss'

import quilnkEditor from 'quilnk/index';
import "@quilnk/theme/src/index.scss";

createApp(App).use(quilnkEditor).mount('#app')
