module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
    "plugin:promise/recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    "no-unused-vars": "warn",
    "no-console": "off",
    semi: ["error", "always"],
    quotes: ["error", "double", { allowTemplateLiterals: true }],
    indent: "off",
    "max-len": ["error", { code: 120 }],
    "require-jsdoc": 0,
    "prefer-arrow-callback": "error",
  },
};
