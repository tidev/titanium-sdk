/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumJSConstants.h"

//Due to memory and CPU time, all the prettyprinting of the javascript has been stripped out of the strings.
//But to keep them still readable, the string is stored in such a way to keep the prettyprinting.

NSString * const titaniumJavascriptInjection =
@"<script>"
"Ti={_TOKEN:'%@',"		//Note to self. Store top._TOKENS[token] = window in order to redirect to subviews.
	"_JSON:function(value){"
		"var object = value;"
		"var type = typeof object;"
		"switch (type) {"
			"case 'undefined': case 'function': case 'unknown': return undefined;"
			"case 'number': case 'boolean': return value;"
			"case 'string': return '\"'+value.replace(/%%/g,'%%25').replace(/#/g,'%%23').replace(/\"/g,'%%5C%%22')+'\"';"
		"}"
		"if(object===null) return 'null';"
		"if(object._JSON) return object._JSON();"
		"if(object.nodeType==1) return 'null';"
		"if(object.constructor.toString().indexOf('Array') != -1) {"

			"var resArray=[];"
			"for(var i=0;i<object.length;i++){"
				"var value = object[i];"
				"if (value !== undefined){value = this._JSON(value);}"
				"if (value !== undefined){resArray.push(value);}"
			"}"
			"return '[' + resArray.join(', ') + ']';"
		"}"
		"var objects = [];"
		"for (var property in object)"
		"{"
			"var value = object[property];"
			"if (value !== undefined){value = this._JSON(value);}"
			"if (value !== undefined){objects.push(this._JSON(property) + ': ' + value);}"
		"}"
		"return '{' + objects.join(', ') + '}';"
	"},"
	"_TICMD:function(objectName,functionName,argList){"
		"var result=null;"
		"var thisURL=null;"
		"var argString='';"
		"var seperatorString='';"
		"for(var i=0;i<argList.length;i++){"
			"var value=argList[i];"
			"if (value !== undefined){value = Ti._JSON(value);}"
			"if (value !== undefined){"
				"argString=argString+seperatorString+Ti._JSON(argList[i]);"
				"seperatorString=',';"
			"}"
		"}"
		"var nextURL='/_TICMD/%@/'+objectName+'/'+functionName+'?['+argString+']';"
		"while(nextURL!=null){"
			"result=null;"
			"thisURL=nextURL;"
			"nextURL=null;"
			"var xhReq=new XMLHttpRequest();"
			"try{"
				"xhReq.open('GET',thisURL,false);"
				"xhReq.send(null);"
				"eval(xhReq.responseText);"
			"}catch(E){"
				"console.error('Error executing '+functionName+', error:'+E);"
				"throw E;"
				//"alert('TICMD EXCEPTION: '+E+'('+nextURL+')('+typeof(xhReq.responseText)+')');"
			"}"
		"}"
		"return result;"
	"},"
	"_ADDEVT:function(type,expression,bubbling){"	/* ADDEVT is the add event function prototype. It's here for speed reasons. */
		"var listeners=this._EVT[type];"
		"if(listeners==undefined)this._EVT[type]=[expression];"
		"else listeners.push(expression);"
		"return expression;"
	"},"
	"_REMEVT:function(type,expression,bubbling){"	/* ADDEVT is the add event function prototype. It's here for speed reasons. */
		"var listeners=this._EVT[type];if(listeners==undefined)return;"
		"var i;var listenerCount=listeners.length;"
		"for(i=0;i<listenerCount;i++){"
		"if(listeners[i]===expression){"
			"listeners.splice(i,1); return true;"
		"}};"
	"return false;},"
	"_ONEVT:function(event){"
		"var listeners=this._EVT[event.type];if(listeners==undefined)return;"
		"event.target=self;"
		"var i;var listenerCount=listeners.length;"
		"for(i=0;i<listenerCount;i++)"
			"{listeners[i](event);}"
	"}"
"}; Titanium=Ti;"
"Titanium.toString = function()"
"{"
" return '[Titanium object]';"
"};"
"Titanium.platform = 'iphone';"
"Titanium.version = '%s';"
"Titanium.userAgent = navigator.userAgent + ' Titanium/' + Titanium.version;" 
"document.addEventListener('click',function(e){"
	"var targ = e.target;"
	"if (targ.nodeType == 3) targ = targ.parentNode;"
	"if (Ti.Platform && targ.target == 'ti:systembrowser') { Ti.Platform.openURL(targ.href); return false; }"
"},true);"
"%@"
"</script>";



/*
 * @tiapi(method=False,property=True,name=platform,since=0.4,type=string) titanium platform name property
 */
/*
 * @tiapi(method=False,property=True,name=version,since=0.4,type=string) titanium platform version property
 */
/*
 * @tiapi(method=False,property=True,name=userAgent,since=0.4,type=string) titanium platform userAgent property
 */
