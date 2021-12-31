const a11yOff = Object.keys(require("eslint-plugin-jsx-a11y").rules).reduce((acc, rule) => {
  acc[`jsx-a11y/${rule}`] = "off";
  return acc;
}, {});

module.exports = {
  env: {
    browser: true,
    es6: true,
    "jsx-control-statements/jsx-control-statements": true
  },
  extends: ["eslint:recommended", "prettier", "plugin:react/recommended", "plugin:jsx-control-statements/recommended"],
  plugins: ["prettier", "jsx-control-statements"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      extends: [
        "airbnb",
        "airbnb-typescript",
        "airbnb/hooks",
        "prettier",
        "plugin:@typescript-eslint/recommended",
        "plugin:jsx-control-statements/recommended",
        "plugin:import/typescript",
        "plugin:react/recommended"
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname
      },
      plugins: ["@typescript-eslint", "prettier", "jsx-control-statements"],
      rules: {
        "react/jsx-no-undef": ["error", { allowGlobals: true }],
        "react/function-component-definition": [
          2,
          {
            namedComponents: "arrow-function"
          }
        ],
        "react/destructuring-assignment": "off",
        "react/jsx-props-no-spreading": "off",
        "react/require-default-props": "off",
        "react-hooks/exhaustive-deps": "off",

        ...a11yOff,
        "no-continue": "off",
        "no-multi-assign": "off",
        "no-param-reassign": "off",
        "no-plusplus": "off",
        "no-return-assign": "off"
      }
    }
  ]
};
