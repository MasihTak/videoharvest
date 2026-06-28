import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router/index.js";
import "@/assets/scss/style.scss";

createApp(App).use(createPinia()).use(router).mount("#app");
