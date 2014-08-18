Appcelerator Titanium iPhone Module Project
===========================================

This is a skeleton Titanium Mobile iPhone module project.  Modules can be 
used to extend the functionality of Titanium by providing additional native
code that is compiled into your application at build time and can expose certain
APIs into JavaScript. 

MODULE NAMING
--------------

Choose a unique module id for your module.  This ID usually follows a namespace
convention using DNS notation.  For example, com.appcelerator.module.test.  This
ID can only be used once by all public modules in Titanium.


COMPONENTS
-----------

Components that are exposed by your module must follow a special naming convention.
A component (widget, proxy, etc) must be named with the pattern:

	Ti<ModuleName><ComponentName>Proxy

For example, if you component was called Foo, your proxy would be named:

	TiMyfirstFooProxy
	
For view proxies or widgets, you must create both a view proxy and a view implementation. 
If you widget was named proxy, you would create the following files:

	TiMyfirstFooProxy.h
	TiMyfirstFooProxy.m
	TiMyfirstFoo.h
	TiMyfirstFoo.m
	
The view implementation is named the same except it does contain the suffix `Proxy`.  

View implementations extend the Titanium base class `TiUIView`.  View Proxies extend the
Titanium base class `TiUIViewProxy` or `TiUIWidgetProxy`.  

For proxies that are simply native objects that can be returned to JavaScript, you can 
simply extend `TiProxy` and no view implementation is required.


GET STARTED
------------

1. Edit manifest with the appropriate details about your module.
2. Edit LICENSE to add your license details.
3. Place any assets (such as PNG files) that are required in the assets folder.
4. Edit the titanium.xcconfig and make sure you're building for the right Titanium version.
5. Code and build.

BUILD TIME COMPILER CONFIG
--------------------------

You can edit the file `module.xcconfig` to include any build time settings that should be
set during application compilation that your module requires.  This file will automatically get `#include` in the main application project.  

For more information about this file, please see the Apple documentation at:

<http://developer.apple.com/mac/library/documentation/DeveloperTools/Conceptual/XcodeBuildSystem/400-Build_Configurations/build_configs.html>


DOCUMENTATION FOR YOUR MODULE
-----------------------------

You should provide at least minimal documentation for your module in `documentation` folder using the Markdown syntax.

For more information on the Markdown syntax, refer to this documentation at:

<http://daringfireball.net/projects/markdown/>


TEST HARNESS EXAMPLE FOR YOUR MODULE
------------------------------------

The `example` directory contains a skeleton application test harness that can be 
used for testing and providing an example of usage to the users of your module.


INSTALL YOUR MODULE
--------------------

1. Run `build.py` which creates your distribution
2. cd to `/Library/Application Support/Titanium`
3. copy this zip file into the folder of your Titanium SDK

REGISTER YOUR MODULE
---------------------

Register your module with your application by editing `tiapp.xml` and adding your module.
Example:

<modules>
	<module version="0.1">__MODULE_ID__</module>
</modules>

When you run your project, the compiler will know automatically compile in your module
dependencies and copy appropriate image assets into the application.

USING YOUR MODULE IN CODE
-------------------------

To use your module in code, you will need to require it. 

For example,

	var my_module = require('__MODULE_ID__');
	my_module.foo();

WRITING PURE JS NATIVE MODULES
------------------------------

You can write a pure JavaScript "natively compiled" module.  This is nice if you
want to distribute a JS module pre-compiled.

To create a module, create a file named __MODULE_ID__.js under the assets folder.
This file must be in the Common JS format.  For example:

	exports.echo = function(s)
	{
		return s;
	};
	
Any functions and properties that are exported will be made available as part of your
module.  All other code inside your JS will be private to your module.

For pure JS module, you don't need to modify any of the Objective-C module code. You
can leave it as-is and build.

TESTING YOUR MODULE
-------------------

Run the `titanium.py` script to test your module or test from within XCode.
To test with the script, execute:

	titanium run --dir=YOURMODULEDIR
	

This will execute the app.js in the example folder as a Titanium application.


DISTRIBUTING YOUR MODULE
-------------------------

Currently, you will need to manually distribution your module distribution zip file directly. However, in the near future, we will make module distribution and sharing built-in to Titanium Developer and in the Titanium Marketplace!


Cheers!
