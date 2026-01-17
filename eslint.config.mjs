import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores([
    "node_modules",
    "**/locales/**/*.js",
    "android/runtime/v8/tools/bootstrap.js",
    "android/dev",
    "android/modules/ui/assets/Resources/ti.internal/webview/*.js",
    "android/titanium/build",
    "android/**/generated/",
    "iphone/Resources/app.js",
    "templates/**/*",
    "tests/fake_node_modules/",
    "tests/node_modules/",
    "tests/Resources/node_modules/",
    "**/dist/",
    "**/tmp/",
]), {
    extends: compat.extends("axway/env-node"),

    languageOptions: {
        ecmaVersion: 5,
        sourceType: "module",
    },

    rules: {
        "no-use-before-define": ["error", {
            functions: false,
            classes: false,
            variables: true,
        }],

        "promise/catch-or-return": ["warn", {
            terminationMethod: ["catch", "finally"],
        }],

        "promise/always-return": "off",
        "promise/no-callback-in-promise": "off",
        "security/detect-child-process": "off",
    },
}, {
    files: [
        "android/runtime/common/src/js/**/*.js",
        "android/modules/**/src/js/**/*.js",
    ],

    languageOptions: {
        globals: {
            kroll: "readonly",
            Titanium: "readonly",
        },

        ecmaVersion: 2024,
        sourceType: "script",
    },
}, {
    files: [
        "android/app/src/main/assets/Resources/**/*.js",
        "iphone/Resources/**/*.js",
    ],

    extends: compat.extends("axway/env-titanium"),
}, {
    files: ["common/Resources/**/*.js"],
    extends: compat.extends("axway/env-titanium"),

    languageOptions: {
        globals: {
            kroll: "readonly",
        },

        ecmaVersion: 2020,
        sourceType: "module",
    },

    rules: {
        "node/no-unsupported-features/es-syntax": "off",
    },
}, {
    files: ["android/cli/tests/test-android-manifest.js", "build/**/test-*.js"],
    extends: compat.extends("axway/env-node", "axway/+mocha"),
}, {
    files: ["tests/**/*.js"],
    extends: compat.extends("axway/env-titanium", "axway/+mocha"),
}, {
    files: ["tests/Resources/ti.ui.webview.script.tag.js"],
    extends: compat.extends("axway/env-titanium", "axway/+mocha"),

    languageOptions: {
        ecmaVersion: 3,
        sourceType: "script",
    },
}, {
    files: ["tests/Resources/es6.*.js", "tests/Resources/util.test.js"],
    extends: compat.extends("axway/env-titanium", "axway/+mocha"),

    languageOptions: {
        ecmaVersion: 5,
        sourceType: "module",
    },

    rules: {
        "node/no-unsupported-features/es-syntax": "off",
    },
}, {
    files: ["cli/lib/tasks/*.js", "cli/hooks/webpack.js", "cli/lib/webpack/**/*.js"],

    languageOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
}]);