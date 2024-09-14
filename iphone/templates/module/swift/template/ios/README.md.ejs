# Titanium iOS Project

This is a skeleton Titanium iOS module project. Modules can be used to extend 
the functionality of Titanium by providing additional native code that is compiled 
into your application at build time and can expose certain APIs into JavaScript.

## Naming

Choose a unique module id for your module. We usually stick to a naming convention 
like `ti.map` or `titanium-map` to make it more easy to find Titanium modules in the wild.


## Components

Components that are exposed by your module must follow a special naming convention.
A component (widget, proxy, etc) must be named with the pattern:

```
Ti<ModuleName><ComponentName>Proxy
```

For example, if you component was called Foo, your proxy would be named:

```
TiMyfirstFooProxy
```

For view proxies or widgets, you must create both a view proxy and a view implementation.
If you widget was named proxy, you would create the following files:

```
TiMyfirstFooProxy.swift
TiMyfirstFoo.swift
```

The view implementation is named the same except it does contain the suffix `Proxy`.

View implementations extend the Titanium base class `TiUIView`. View Proxies extend the
Titanium base class `TiUIViewProxy` or `TiUIWidgetProxy`.

For proxies that are simply native objects that can be returned to JavaScript, you can
simply extend `TiProxy` and no view implementation is required.

## Get started

1. Edit manifest with the appropriate details about your module.
2. Edit LICENSE to add your license details.
3. Place any assets (such as PNG files) that are required in the assets folder.
4. Edit the titanium.xcconfig and make sure you're building for the right Titanium version.
5. Code and build.

## Build time configuration

You can edit the file `module.xcconfig` to include any build time settings that should be
set during application compilation that your module requires. This file will automatically get imported 
in the main application project.

For more information about this file, please see the [Apple documentation](https://developer.apple.com/library/content/featuredarticles/XcodeConcepts/Concept-Build_Settings.html).

# Documentation

You should provide at least minimal documentation for your module in `documentation` folder using the 
Markdown syntax.

For more information on the Markdown syntax, refer to [this documentation](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet).

## Examples

The `example` directory contains a skeleton application test harness that can be
used for testing and providing an example of usage to the users of your module.

## Install

1. Run `ti build -p ios --build-only` which creates your distribution package
2. Switch to `~/Library/Application Support/Titanium`
3. Copy this zip file into the folder of your Titanium SDK or copy it to your local project

## Register the module

Register your module with your application by editing `tiapp.xml` and adding your module.
Example:

```
<modules>
  <module version="0.1">__MODULE_ID__</module>
</modules>
```

When you run your project, the compiler will know automatically compile in your module
dependencies and copy appropriate image assets into the application.

## Using the module

To use your module in code, you will need to require it.

For example,

```js
var myModule = require('__MODULE_ID__');
myModule.foo();
```

## Pure JavaScript modules

You can write a pure JavaScript "natively compiled" module. This is nice if you
want to distribute a JavaScript module pre-compiled.

To create a module, create a file named __MODULE_ID__.js under the assets folder.
This file must be in the CommonJS format. For example:

```js
exports.echo = (content) => {
  return content;
};
```

Any functions and properties that are exported will be made available as part of your
module. All other code inside your JavaScript will be private to your module.

For pure JavaScript module, you don't need to modify any of the Swift module code. You
can leave it as-is and build.

## Testing

Run the `ti` CLI to test your module or test from within Xcode.
To test with the script, execute:

```
ti build --project-dir <your-module-directory>
```

This will execute the app.js in the example folder as a Titanium application.

Cheers!
