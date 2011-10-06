/**
 * Appcelerator Drillbit
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * WARNING: this is a generated Drillbit test suite
 * -- <%= entry.name %>
 */

var testName = "<%= entry.name %>";

<%
methodWrap = typeof(methodWrap) == 'undefined' ? false : methodWrap;
autoRun = typeof(autoRun) == 'undefined' ? true : autoRun;
%>

<%= Drillbit.drillbitTestJs %>

// top level method wrap is inverted
<% if (!methodWrap) { %>
function runTests() {
<% } %>

<%	
	function addLineNumbers(entry, fname) {
		var code = String(entry.test[fname]);
		var lines = code.split("\n");
		var ready = false;
		var newCode = "";
		for (var lineNumber = 0; lineNumber < lines.length; lineNumber++) {
			var line = lines[lineNumber];
			var idx = line.indexOf('.should');
			if (idx == -1) {
				idx = line.indexOf('fail(');
			}
			if (idx != -1) {
				var endIdx = line.lastIndexOf(')');
				var absoluteLine = lineNumber + entry.lineOffsets[fname] + 1;
				if (line.charAt(endIdx-1)=='(') {
					line = line.substring(0, endIdx) + 'null,' + absoluteLine + ');';
				} else {
					line = line.substring(0, endIdx) + ',' + absoluteLine + ');';
				}
			
			}
			newCode += line + "\n";
		}
		
		return newCode;
	}
	
	function makeFunction(entry, fname, scope) {
		var f = entry.test[fname];
		if (typeof(f) == 'function') {
			if (typeof(scope) == 'undefined') {
				return '(' + addLineNumbers(entry, fname) + ')();\n';
			} else {
				var expr = '(function(){var _scope = ' + scope + ';\n';
				expr += '(' + addLineNumbers(entry, fname) + ').call(_scope,_scope);\n';
				expr += '})();\n';
				return expr;
			}
		} else if (typeof(f) != 'undefined' && f.async) {
			var expr = '(function(){var _scope = ' + scope + ';\n';
			expr += 'var _asyncTest = ' + addLineNumbers(entry, fname) + ';\n';
			expr += '_asyncTest.start(_scope,_scope);\n';
			expr += '})();\n';
			return expr;
		}
		return '';
	};
%>


DrillbitTest.NAME = "<%= entry.name %>";
DrillbitTest.SOURCE = "<%= entry.sourceFile.nativePath().replace(/\\/g, "\\\\") %>";
DrillbitTest.autoRun = <%= autoRun %>;


<% if (methodWrap) { %>
DrillbitTest.BEFORE_ALL = function() {
<% } %>
try
{
	appendMessage('running suite ' + DrillbitTest.NAME + ' before_all');
	<%= makeFunction(entry, 'before_all', 'DrillbitTest.gscope') %>
}
catch (e)
{
	Titanium.API.error('before_all caught error:'+e+' at line: '+e.line);
}

<% if (methodWrap) { %>
};
<% } %>

<% for (var f in entry.test) {
	var i = excludes.indexOf(f);
	var run = (entry.testsToRun == "all" || entry.testsToRun.indexOf(f) != -1);
	if (i == -1 && run) { %>

		var <%= f %>_wrapper = function() {
			var xscope = new DrillbitTest.Scope('<%= f %>');
			<%= makeFunction(entry, 'before', 'xscope') %>;

			try {
				var initialAssertions = DrillbitTest.totalAssertions;
				DrillbitTest.currentTest = '<%= f %>';
				DrillbitTest.runningTest('<%= entry.name %>', '<%= f %>');
				<%= makeFunction(entry, f, 'xscope') %>;
				<%
				i = f.indexOf('_as_async');
				if (i == -1 && typeof(entry.test[f].async) == 'undefined')
				{ %>
					var finalAssertions = DrillbitTest.totalAssertions;
					if (finalAssertions - initialAssertions == 0) {
						Titanium.API.warn('No assertions in test function: <%= f %>');
					}
					var lineNumber = 0;
					if (DrillbitTest.currentSubject) {
						if ("lineNumber" in DrillbitTest.currentSubject) {
							lineNumber = DrillbitTest.currentSubject.lineNumber;
						}					
					}
					DrillbitTest.testPassed('<%= f %>',lineNumber);
				<% } %>
			}
			catch (___e)
			{
				// wrap the exception message so we can report the failed test's line number
				var ___err = {
					message: ___e.message || ("Non-assertion exception: " + String(___e)),
					line: ___e.constructor == DrillbitTest.Error ? ___e.line : <%= entry.lineOffsets[f] %>,
					toString: function() { return this.message; }
				};
				DrillbitTest.testFailed('<%= f %>', ___err);
			}

			<%= makeFunction(entry, 'after', 'xscope') %>
			// --- <%= f %> ---
		};
		
		<%= f %>_wrapper.testName = "<%= f %>";
		DrillbitTest.tests.push(<%= f %>_wrapper);
<%	}
} %>

	DrillbitTest.AFTER_ALL = DrillbitTest.onComplete = function() {
		try {
			appendMessage('running suite ' + DrillbitTest.NAME + ' after_all');
			<%= makeFunction(entry, 'after_all', 'DrillbitTest.gscope') %>;
		} catch (e) {
			Titanium.API.error('after_all caught error:'+e+' at line: '+e.line);
		}
		DrillbitTest.complete();
	};
	<% if (autoRun) { %>
	DrillbitTest.runNextTest();
	<% } %>

<% if (!methodWrap) { %>
}
<% } %>
