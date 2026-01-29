// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([...nextVitals, ...nextTs, // WCAG 2.2 AAA - Accessibility rules
{
  rules: {
    ...jsxA11y.configs.strict.rules,
  },
}, // Security rules (CWE Top 25 + OWASP Top 10)
{
  plugins: {
    security: security,
  },
  rules: {
    ...security.configs.recommended.rules,
  },
}, // Override default ignores of eslint-config-next.
globalIgnores([
  // Default ignores of eslint-config-next:
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
]), ...storybook.configs["flat/recommended"]]);

export default eslintConfig;
