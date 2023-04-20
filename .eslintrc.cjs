module.exports = {
  root: true,

  env: {
    node: true
  },

  extends: [
    "plugin:vue/essential",
    "plugin:cypress/recommended",
    "@vue/standard",
    "@vue/typescript/recommended"
  ],

  plugins: ['vue'],

  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "quotes": [1, "single"],
    "semi": [1, "never"],
    "indent": [1, 2],
    "eol-last": [1, "always"],
    "@typescript-eslint/no-var-requires": 1
  },

};
