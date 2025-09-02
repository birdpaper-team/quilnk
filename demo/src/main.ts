import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import quilnkEditor from 'quilnk/index';
console.log('quilnkEditor: ', quilnkEditor);

createApp(App).use(quilnkEditor).mount('#app')
