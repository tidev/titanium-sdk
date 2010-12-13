# TDoc: The Titanium API Documentation Format

_This documentation is a WIP_

The TDoc format follows a simple syntax for declaring Modules, Proxies, Methods, Properties, and Events for Titanium.

## Layout
The documentation tree starts in the Titanium folder, and generally follows this pattern:

<pre>
Titanium/
-- Module/
---- Module.tdoc
---- Proxy.tdoc
---- SubModule/
------ SubModule.tdoc
</pre>

## Format
A TDoc file basically consists of sections, and properties, and allows for free-form [Markdown](http://daringfireball.net/projects/markdown/syntax) in most places.

A section usually looks like:
<pre>- SECTION

section content</pre>

### Common sections
* namespace (full namespace of the object)
* type (module, proxy, view, property, method)
* description (a full length description)
* since (what version of Titanium this object was added in)
* platforms (android,iphone,ipad)
* notes (special notes for this object)
* example (named code examples)

### Proxy and Module sections
* methods (list of method names and descriptions)
* method (section for a single method with parameters and return type)
* properties (list of property names, types, and descriptions)
* events (events fired by this proxy or module)
* event (section for a single event with event object properties)

### Named sections
The method, event, and example sections all support embedded names, and in the case of the method section also supports a return type. Some quick examples:
<pre># returns void
- method : helloWorld

# returns string
- method : methodName, string
method documentation..

- event : eventName
event documentation..

- example : My Cool Example
&lt;code&gt;
// here's some code..
&lt;/code&gt;</pre>

### Section Properties
Section Properties generally take the form:
<pre>name[type]: value</pre>

### Method parameters
Method parameters are defined as properties under a Method section. Titanium types can be auto-link by surrounding the full API Name (using Titanium instead of Ti) using backticks. For example:

<pre>- method : format, string
formatString[string]: The format string
args[array,...]: The format arguments

- method : createTableView, `Titanium.UI.TableView`
returns a new table view

- method : updateRow
row[`Titanium.UI.TableViewRow`]: row to update</pre>

### Properties
Defined as properties under the Properties section, and can also auto-link Titanium types with backticks, For example:
<pre>- properties
name[string]: Name documentation
myView[`Titanium.UI.View`]: my view</pre>

## AutoLinking Titanium types
Except in the special cases of Properties and Method Parameters, you can generate a link to a Titanium type by surrounding it with double brackets, like so:

<pre>- description
Creates a [[Titanium.UI.TableView]]</pre>

