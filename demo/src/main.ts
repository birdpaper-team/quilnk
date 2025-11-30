import { createApp } from 'vue'
import App from './App.vue'
import './style.scss'

import BirdpaperUI from 'birdpaper-ui';
import 'birdpaper-ui/dist/index.css';

import "@quilnk/theme/src/index.scss";

createApp(App).use(BirdpaperUI).mount('#app')
