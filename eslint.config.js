import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";

export default [
  {
    ignores: ["node_modules", "dist", "src-tauri/target"],
  },

  js.configs.recommended,

  ...pluginVue.configs["flat/recommended"],

  {
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
    files: ["**/*.{js,vue}"],
    rules: {
      "no-console": "warn",
      "no-debugger": "error",
      "vue/no-unused-vars": "error",
      "vue/max-attributes-per-line": "error",
      "vue/component-name-in-template-casing": [
        "error",
        "PascalCase",
        {
          registeredComponentsOnly: true,
          ignores: [],
          globals: [
            "RouterView",
            "Teleport",
            "Component",
            "Transition",
            "TransitionGroup",
          ],
        },
      ],
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always",
            normal: "always",
          },
        },
      ],
    },
  },
];
