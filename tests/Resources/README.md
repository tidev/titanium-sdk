# Mocha Test Suite Override
The tests folder acts as a local override for the mocha unit test suite.

You should place any modified files from the test suite into this folder, and we will copy it over the top of the common suite.

## Adding a New Test or Modifying an Existing Test
If you'd like to add a new unit test, it's recommended that you copy the relevant existing script from  https://github.com/appcelerator/titanium-mobile-mocha-suite into the correct folder structure underneath tests, with your modifications. If the file isn't entirely new, you don't need to worry about modifying app.js as well.

## Adding a New test Suite/File
If you'd like to add a new test suite or new file that doesn't exist in the common suite, please be sure to name the file correctly with the file ending in `.addontest.js`, for example to add new tests for the API `Ti.NewNamespace` call the file `Ti.NewNamespace.addontest.js`, the app will automatically pick up files that end in this.

If you're adding new test resources, you can simply add them to the correct folder structure without worrying about modifying app.js.

One caveat is that the list of modules and plugins are not yet dynamically generated from the filesystem. So even though you may add the new module/plugin folder, the tiapp.xml for the test suite won't get that new module/plugin added. You'll need to modify the test suite's behavior to do so: https://github.com/appcelerator/titanium-mobile-mocha-suite/blob/master/scripts/test.js
