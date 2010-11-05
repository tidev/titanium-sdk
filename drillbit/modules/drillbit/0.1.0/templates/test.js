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

function runTests() {
<%
	var TFS = Titanium.Filesystem;
	var TA = Titanium.App;
	
	function addLineNumbers(entry, fname) {
		var code = String(entry.test[fname]);
		var lines = code.split("\n");
		var ready = false;
		var newCode = "";
		for (var lineNumber = 0; lineNumber < lines.length; lineNumber++) {
			var line = lines[lineNumber];
			var idx = line.indexOf('.should');
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
		}
		return '';
	};
%>

<%= Drillbit.drillbitTestJs %>

DrillbitTest.NAME = "<%= entry.name %>";
DrillbitTest.SOURCE = "<%= entry.sourceFile.nativePath().replace(/\\/g, "\\\\") %>";
DrillbitTest.RESULTS_DIR  = "<%= Drillbit.resultsDir %>";

try
{
	appendMessage('running suite <span class="suite">' + DrillbitTest.NAME + '</span> before_all');
	<%= makeFunction(entry, 'before_all', 'DrillbitTest.gscope') %>
}
catch (e)
{
	Titanium.API.error('before_all caught error:'+e+' at line: '+e.line);
}

appendMessage('running tests on suite <span class="suite">' + DrillbitTest.NAME + '</span>');

<% for (var f in entry.test) {
	var i = excludes.indexOf(f);
	var run = (entry.testsToRun == "all" || entry.testsToRun.indexOf(f) != -1);
	if (i == -1 && run) { %>

		DrillbitTest.tests.push(function(){
			// <%= f %>
			var xscope = new DrillbitTest.Scope('<%= f %>');
			<%= makeFunction(entry, 'before', 'xscope') %>;

			try {
				DrillbitTest.currentTest = '<%= f %>';
				DrillbitTest.runningTest('<%= entry.name %>', '<%= f %>');
				<%= makeFunction(entry, f, 'xscope') %>;
				<%
				i = f.indexOf('_as_async');
				if (i==-1)
				{ %>
					DrillbitTest.testPassed('<%= f %>',DrillbitTest.currentSubject.lineNumber);
				<% } %>
			}
			catch (___e)
			{
				// wrap the exception message so we can report the failed test's line number
				var ___err = {
					message: ___e.message || "Non-assertion exception: " + String(___e),
					line: ___e.constructor == DrillbitTest.Error ? ___e.line : <%= entry.lineOffsets[f] %>,
					toString: function() { return this.message; }
				};
				DrillbitTest.testFailed('<%= f %>', ___err);
			}

			<%= makeFunction(entry, 'after', 'xscope') %>
			// --- <%= f %> ---
		});
<%	}
} %>

	DrillbitTest.onComplete = function() {
		try {
			appendMessage('running suite <span class="suite">' + DrillbitTest.NAME + '</span> after_all');
			<%= makeFunction(entry, 'after_all', 'DrillbitTest.gscope') %>;
		} catch (e) {
			Titanium.API.error('after_all caught error:'+e+' at line: '+e.line);
		}
		DrillbitTest.complete();
	};

	DrillbitTest.runNextTest();
}