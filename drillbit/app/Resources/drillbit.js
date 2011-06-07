/**
 * Appcelerator Drillbit
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var TFS = Titanium.Filesystem;
var TA  = Titanium.App;
var Drillbit = Titanium.Drillbit;

var runLinkDisabled = false;
var frontend = {
	passed: 0, failed: 0,
	
	setup_finished: function() {
		runLinkDisabled = false;
		$("#run-link").removeClass("disabled");
	},
	
	status: function(text, loading) {
		loading = typeof(loading) == 'undefined' ? false : !!loading;
		
		var html = '<b>'+text+'</b>';
		if (loading) {
			html = '<img src="images/ajax.gif"/> '+html;
		}
		
		$('#current-test').html(html);
	},
	
	test_platform_status: function(name, classname, platform)
	{
		var id = genSuiteId(name);
		var el = $('#'+id+'_'+platform+'_status');
		el.html(classname);
		el.removeClass('untested').removeClass('failed').removeClass('running')
			.removeClass('passed').removeClass('init').addClass(classname.toLowerCase());
	},
	
	test_status: function(name, classname)
	{
		var id = genSuiteId(name);
		$('#'+id).removeClass('suite-untested').removeClass('suite-failed')
			.removeClass('suite-running').removeClass('suite-passed').addClass('suite-'+classname.toLowerCase());
	},
	
	test_passed: function(suite, test)
	{
		this.passed++;
	},
	
	test_failed: function(suite, test, line_number, error)
	{
		this.failed++;
	},
	
	suite_started: function(suite, platforms)
	{
		this.test_status(suite, 'Running');
		var self = this;
		platforms.forEach(function(platform) {
			self.test_platform_status(suite, 'Init', platform);
		});
	},
	
	building_test_harness: function(suite, platform)
	{
		this.test_platform_status(suite, 'Building', platform);
	},
	
	running_test_harness: function(suite, platform)
	{
		this.test_platform_status(suite, 'Running', platform);
	},
	
	total_progress: function(passed,failed,total)
	{
		$('#passed-count').html('<img src="images/check_on.png"/>&nbsp;&nbsp;'+passed+' passed');
		$('#failed-count').html('<img src="images/check_off.png"/>&nbsp;&nbsp;'+failed+' failed');
	},
	
	show_current_test: function(suite_name, test_name)
	{
		$('#current-test').html('<b>'+suite_name + '</b>:&nbsp;&nbsp;' + test_name);
	},
	
	add_assertion: function(test_name, line_number)
	{
		$('#assertion-count').html(Drillbit.totalAssertions+' assertions');
	},
	
	process_data: function(data)
	{
		var drillbit_console = $('#console');
		
		drillbit_console.append(data+"\n");
		drillbit_console.scrollTop(drillbit_console[0].scrollHeight);
	},
	
	all_finished: function()
	{
		$("#run-link").removeClass("disabled");
		runLinkDisabled = false;
		$('#current-test').html('<b>Finished.</b> Took ' + Drillbit.testDuration + 's');
	}
};

function showTestDetails(name)
{
	var w = Titanium.UI.currentWindow.createWindow();
	w.setHeight(600);
	w.setWidth(850);
	w.setURL('app://test_results/' + name + '.html');
	w.open();
}

function toggleTestIncludes()
{	
	$.each($("img.platform-check"),function()
	{
		if ($(this).attr('src').indexOf('check_on') == -1)
		{
			$(this).attr('src', 'images/check_on.png');
		}
		else
		{
			$(this).attr('src', 'images/check_off.png');
		}
	});
}

function clearCurrentTest()
{
	$('#current-test').html('<span style="color: #ccc">&lt;no tests currently running&gt;</span>')	
}

function resetAll()
{	
	$('img.platform-check').attr('src', 'images/check_on.png');
	$('div[id^=suite_]').removeClass().addClass('suite');
	$('span[id^=suite_]').removeClass().addClass('untested').html('untested');
	$('#assertion-count').html('0 assertions');
	$('#passed-count').html('<img src="images/check_on.png"/>&nbsp;&nbsp;0 passed');
	$('#failed-count').html('<img src="images/check_off.png"/>&nbsp;&nbsp;0 failed');
	clearCurrentTest();
	Drillbit.reset();
}

var suiteIds = {};
function genSuiteId(suite) {
	var id = "suite_" + suite.replace(/\./g, "_").replace(/\#/g, "_");
	suiteIds[id] = suite;
	return id;
}

function initUI() {
	clearCurrentTest();
	$("#test-count").html(Drillbit.totalTests + ' tests in ' + Drillbit.totalFiles + ' files');
	
	var suites_html = '';
	Drillbit.testNames.forEach(function(name) {
		var entry = Drillbit.tests[name];
		var id = genSuiteId(name);
		suites_html +=
		'<div class="suite" id="'+id+'">'+
			'<span class="suite-name">'+name+'</span><br/>'+
			'<span class="description">'+entry.description+'</span><br/>'+
			'<div class="suite-status">';
		
		entry.platforms.forEach(function(platform) {
			suites_html += '<div class="'+platform+'-status platform-status">'+
				'<img class="'+platform+'-check platform-check" src="images/check_on.png"/>'+
				'<img src="images/'+platform+'.png"/><span id="'+id+'_'+platform+'_status" class="untested">untested</span></div>';
		});
			
		suites_html += '</div></div>';
	});
	
	$('div.suites').html(suites_html);
	$('div[class=suite-status]>div').click(function() {
		var checkImg = $(this).find('img[class$=-check]');
		if (checkImg.attr('src').indexOf('check_on') != -1) {
			checkImg.attr('src', 'images/check_off.png');
		} else {
			checkImg.attr('src', 'images/check_on.png');
		}
	});
	$('div[id^=suite_]').dblclick(function()
	{
		var suite = suiteIds[$(this).attr('id')];
		showTestDetails(suite);
	});
}

function reloadUI() {
	// try to preserve checkbox state
	var checks = {};
	$.each($("img.platform-check"), function() {
		var platformClass = $(this).attr("class");
		var platform = platformClass.substring(0, platformClass.indexOf('-'));
		
		var suiteDivId = $(this).parent().parent().parent().attr("id");
		var suite = suiteIds[suiteDivId];
		if (!(suiteDivId in checks)) {
			checks[suiteDivId] = {};
		}
		var checked = $(this).attr('src').indexOf('check_on') != -1;
		checks[suiteDivId][platform] = checked;
	});
	
	initUI();
	for (var suiteId in checks) {
		for (var platform in checks[suiteId]) {
			var check = $('#'+suiteId+'>div.suite-status>div>img.'+platform+'-check');
			var checked = checks[suiteId][platform];
			var src = checked ? 'images/check_on.png' : 'images/check_off.png';
			$(check).attr('src', src);
		}
	}
}

function reloadTests() {
	Drillbit.rescan();
	reloadUI();
}

$(window).ready(function()
{
	var mouseDown = false,
		startY = 0,
		drillbitConsole= document.getElementById('console'),
		drillbitResize= document.getElementById('resize-bar'), 
		drillbitSuite=document.getElementsByClassName('suites')[0],
		startHeightSuite=$(drillbitSuite).height(),
		startHeightConsole = $(drillbitConsole).height(),
		resizerHeight = 12;	

	if ('webConsole' in Drillbit.argv) {
		Titanium.UI.currentWindow.showInspector(true);
	}

	Drillbit.runTestsAsync = true;
	Drillbit.frontend = frontend;
	Drillbit.window = window;
	initUI();	
	
	var runLink = $('#run-link');
	$('#toggle-link').click(function() {
		toggleTestIncludes();
	});
	$('#reset-link').click(function() {
		resetAll();
	});
	$('#reload-link').click(function() {
		reloadTests();
	});
	$('#clear-link').click(function() {
		$("#console").html("");
		return false;
	});
	$('#force-build-android').click(function() {
		if ('android' in Drillbit.emulators) {
			Drillbit.emulators.android.needsBuild = $(this).is(':checked');
		}	
	});
	$("#resize-bar").mousedown(function() {
		mouseDown = true;
		startHeightConsole = $(drillbitConsole).height();
		startHeightSuite = $(drillbitSuite).height();		
		startY = event.clientY;
	});
	$("body").mousemove(function() {
		if (mouseDown)
		{
			mouseY = event.clientY;
			$(drillbitConsole).height((startY - mouseY) + startHeightConsole);
			$(drillbitSuite).height(window.innerHeight - 85 - $(drillbitConsole).height());
			drillbitResize.style.bottom = (startY - mouseY) + startHeightConsole + resizerHeight;
		}
	});
	$("body").mouseup(function() {
		if (mouseDown) {
			mouseDown = false;
			mouseY = event.clientY;
			$(drillbitConsole).height((startY - mouseY) + startHeightConsole);
			$(drillbitSuite).height(window.innerHeight - 85 - $(drillbitConsole).height());
			drillbitResize.style.bottom = (startY - mouseY) + startHeightConsole + resizerHeight;
		}
		
	});
	runLink.click(function () {
		if (!runLinkDisabled)
		{
			reloadTests();
			
			runLinkDisabled = true;
			$("#run-link").addClass("disabled");
			$("#clear-link").click();
			
			var tests = [];
			$.each($('div[id^=suite_]'),function()
			{
				var name = suiteIds[$(this).attr('id')];
				frontend.test_status(name, 'untested');
				
				var test = {suite: name, tests: 'all', platforms: []};
				var add_test = false;
				$(this).find('div.suite-status > div > img[class$=\'-check\']').each(function() {
					if ($(this).attr('src').indexOf('check_on') != -1) {
						var className = $(this).attr('class');
						var platform = className.substring(0, className.indexOf('-'));
						Titanium.API.debug("checked: " + name + " platform: " + platform);
						test.platforms.push(platform);
						add_test = true;
					}
				});
				if (add_test) {
					tests.push(test);
				}
			});
			
			Titanium.API.debug("running tests: " + tests.length);
			Drillbit.runTests(tests, true);
		}
		else
		{
			alert("Tests are currently running");
		}
	});
	
	if ('tests' in Drillbit.argv) {
		toggleTestIncludes();
		Drillbit.argv.tests.split(",").forEach(function(test) {
			var suiteId = genSuiteId(test);
			$('#'+suiteId+'>div.suite-status>div>img.platform-check').attr('src', 'images/check_on.png');
		});
	}
	
	if ('autoclose' in Drillbit.argv) {
		Drillbit.autoClose = true;
	}
	
	if ('autorun' in Drillbit.argv) {
		runLink.click();
	}
});

