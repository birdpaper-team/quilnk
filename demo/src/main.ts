import { createApp } from 'vue'
import App from './App.vue'
import './style.scss'

import BirdpaperUI from 'birdpaper-ui';
import 'birdpaper-ui/dist/index.css';

import Quilnk from "quilnk/index.ts";
import "@quilnk/theme/src/index.scss";

createApp(App).use(BirdpaperUI).use(Quilnk).mount('#app')
