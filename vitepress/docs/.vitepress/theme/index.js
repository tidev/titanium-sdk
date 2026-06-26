import DefaultTheme from 'vitepress/theme';
import './custom.css';
import ApiProperties from './components/ApiProperties.vue';
import ApiMethods from './components/ApiMethods.vue';
import ApiEvents from './components/ApiEvents.vue';
import ApiExamples from './components/ApiExamples.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ApiProperties', ApiProperties);
    app.component('ApiMethods', ApiMethods);
    app.component('ApiEvents', ApiEvents);
    app.component('ApiExamples', ApiExamples);
  },
};
