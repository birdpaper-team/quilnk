import { createApp } from 'vue'
import App from './App.vue'
import './style.scss'

import BirdpaperUI from 'birdpaper-ui';
import 'birdpaper-ui/dist/style.css';

import quilnkEditor from 'quilnk/index';
import "@quilnk/theme/src/index.scss";

createApp(App).use(quilnkEditor).use(BirdpaperUI).mount('#app')
