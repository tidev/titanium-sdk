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
var consoleData = [];
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
	
	update_assertions: function()
	{
		$('#assertion-count').html(Drillbit.totalAssertions+' assertions');
	},
	
	process_data: function(data)
	{
		var drillbit_console = $('#console');
		var search = ($('#filter').val()).toUpperCase();
		if ((data.toUpperCase()).indexOf(search) >= 0) {
			drillbit_console.append(data+"\n");
		}
		drillbit_console.scrollTop(drillbit_console[0].scrollHeight);
		consoleData.push(data);
		if (Drillbit.logStream != null){
			Drillbit.logStream.write(data+"\n");
		}
	},
	
	all_finished: function()
	{
		var drillbit_console = $('#console');
		$("#run-link").removeClass("disabled");
		runLinkDisabled = false;
		$('#current-test').html('<b>Finished.</b> Took ' + Drillbit.testDuration + 's');
		$("#log-link").removeClass("disabled");
		drillbit_console.append("**********************FINISHED LOGGING**********************\n");
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
		drillbitConsoleContainer = document.getElementById('console-container'),
		drillbitFilter = document.getElementById('filter');
		drillbitResize = document.getElementById('resize-bar'), 
		drillbitSuite = document.getElementsByClassName('suites')[0],
		filterHeight = $(drillbitFilter).height(),
		resizerHeight = $(drillbitResize).height(),
		spaceBuffer = 85;
		
	if ('webConsole' in Drillbit.argv) {
		Titanium.UI.currentWindow.showInspector(true);
	}

	if ('resetConfig' in Drillbit.argv) {
		Titanium.App.Properties.removeProperty("windowX");
		Titanium.App.Properties.removeProperty("windowY");
		Titanium.App.Properties.removeProperty("height");
		Titanium.App.Properties.removeProperty("width");
		Titanium.App.Properties.removeProperty("consoleContainerHeight");
		Titanium.App.Properties.removeProperty("suitesStatus");
	}
	setupConfig();

	Drillbit.runTestsAsync = true;
	Drillbit.frontend = frontend;
	Drillbit.window = window;
	initUI();	
	
	if (!('tests' in Drillbit.argv)) {	
		eachPlatformCheck(function(name, platform, platformCheck, suitesStatus) {
			if (name in suitesStatus && platform in suitesStatus[name]) {
				var checked = suitesStatus[name][platform];
				platformCheck.attr('src', 'images/check_' + (checked ? 'on' : 'off') + '.png');
			}
		});
	}
	
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
	$('#log-link').click(function() {		
		if(!$("#log-link").hasClass("disabled")){
			Titanium.Platform.openApplication(Drillbit.logPath.nativePath());
		}
	});
	$(drillbitFilter).keyup(function() {
		var searchVal = $(drillbitFilter).val();
		var searchConsoleData = '';
		consoleData.forEach(function(line) {
			if ((line.toUpperCase()).indexOf(searchVal.toUpperCase()) >= 0) {
				searchConsoleData += line + '\n';
			}
		});
		$('#console').html(searchConsoleData);
	});
	$("#resize-bar").mousedown(function() {
		mouseDown = true;
		startHeightConsoleContainer = $(drillbitConsoleContainer).height();
		startY = event.clientY;
	});
	$("body").mousemove(function() {
		if (mouseDown)
		{
			mouseY = event.clientY;
			var windowHeight = Titanium.UI.currentWindow.getHeight();
			$(drillbitConsoleContainer).height((startY - mouseY) + startHeightConsoleContainer);
			$(drillbitSuite).height(windowHeight - spaceBuffer - $(drillbitConsoleContainer).height());
			drillbitResize.style.bottom = (startY - mouseY) + startHeightConsoleContainer + resizerHeight + filterHeight;
			
		}
	});
	$("body").mouseup(function() {
		if (mouseDown) {
			mouseDown = false;
			mouseY = event.clientY;
			var windowHeight = Titanium.UI.currentWindow.getHeight();
			$(drillbitConsoleContainer).height((startY - mouseY) + startHeightConsoleContainer);
			$(drillbitSuite).height(windowHeight - spaceBuffer - $(drillbitConsoleContainer).height());
			drillbitResize.style.bottom = (startY - mouseY) + startHeightConsoleContainer + resizerHeight + filterHeight;
		}
	});
	$(window).resize(function() {
		var windowHeight = Titanium.UI.currentWindow.getHeight();
		$(drillbitConsoleContainer).height(windowHeight-$(drillbitSuite).height()-spaceBuffer);
		drillbitResize.style.bottom = $(drillbitConsoleContainer).height() + resizerHeight + filterHeight;
	});
	
	function eachPlatformCheck(fn) {
		var suitesStatus = JSON.parse(Titanium.App.Properties.getString("suitesStatus", "{ }"));
		Drillbit.testNames.forEach(function(name) {
			var suiteId = genSuiteId(name);
			var suiteDiv = $('#' + suiteId);
			var entry = Drillbit.tests[name];
			if (!(name in suitesStatus)) {
				suitesStatus[name] = {};
			}
			entry.platforms.forEach(function(platform) {
				var platformCheck = suiteDiv.find('img.' + platform + '-check');
				fn(name, platform, platformCheck,suitesStatus);
			});
		});
		Titanium.App.Properties.setString("suitesStatus", JSON.stringify(suitesStatus));
	};
	
	function setupConfig() {
		var defaultWidth = Titanium.UI.currentWindow.getWidth();
		var defaultHeight = Titanium.UI.currentWindow.getHeight();
		var defaultX = Titanium.UI.currentWindow.getX();
		var defaultY = Titanium.UI.currentWindow.getY();
		
		var windowWidth = Titanium.App.Properties.getInt("width", defaultWidth);
		var windowHeight = Titanium.App.Properties.getInt("height", defaultHeight);
		var windowX = Titanium.App.Properties.getInt("windowX", defaultX);
		var windowY = Titanium.App.Properties.getInt("windowY", defaultY);
		var bounds = { x: windowX, y: windowY, width: windowWidth, height: windowHeight };
	
		Titanium.UI.currentWindow.setBounds(bounds);
	
		var consoleContainerHeight = Titanium.App.Properties.getInt("consoleContainerHeight", 275);
		$(drillbitConsoleContainer).height(consoleContainerHeight);
		var newHeight = $(drillbitConsoleContainer).height();
		var suiteHeight = windowHeight - spaceBuffer - newHeight;
		$(drillbitSuite).height(suiteHeight);
		drillbitResize.style.bottom = $(drillbitConsoleContainer).height() + resizerHeight + filterHeight;
	};

	function saveSettings() {
		var bounds = Titanium.UI.currentWindow.getBounds();
		Titanium.App.Properties.setInt("windowX", bounds.x);
		Titanium.App.Properties.setInt("windowY", bounds.y);
		Titanium.App.Properties.setInt("height", bounds.height);
		Titanium.App.Properties.setInt("width", bounds.width);
		Titanium.App.Properties.setInt("consoleContainerHeight", $(drillbitConsoleContainer).height());
		eachPlatformCheck(function(name, platform, platformCheck, suitesStatus) {
			suitesStatus[name][platform] = $(platformCheck).attr('src').indexOf('check_on') != -1;
		});
	};
	Titanium.UI.currentWindow.addEventListener("close", saveSettings);
	runLink.click(function () {
		if (!runLinkDisabled)
		{
			if (Drillbit.logStream == null) {
				Drillbit.logStream = Drillbit.logPath.open(TFS.MODE_APPEND);
			}
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

