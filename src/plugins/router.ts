import Terminal from "@/components/Terminal.vue";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import Device from '../components/Device.vue';
import DeviceList from '../components/DeviceList.vue';
import Launcher from '../components/Launcher.vue';
import InstallPlugin from '../components/plugin/InstallPlugin.vue';
import Plugins from '../components/plugin/Plugins.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/device/:id',
    name: 'Device',
    component: Device,
  },
  {
    path: '/device',
    name: 'DeviceList',
    component: DeviceList,
  },
  {
    path: "/component/plugin/install",
    name: 'InstallPlugin',
    component: InstallPlugin
  },
  {
    path: '/component/plugin',
    name: 'Plugins',
    component: Plugins,
  },
  {
    path: "/component/shell",
    component: Terminal,
  },
  {
    path: '/',
    name: 'Launcher',
    component: Launcher,
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // always scroll to top
    return savedPosition || { top: 0 }
  },
});

export default router;
