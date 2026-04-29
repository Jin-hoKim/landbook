import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './assets/styles.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/ListPage.vue') },
    { path: '/r/:token', component: () => import('./views/ViewerPage.vue') },
    { path: '/r/:token/raw', component: () => import('./views/RawPage.vue') },
  ],
});

createApp(App).use(router).mount('#app');
