Titanium = Ti = {};

//NOTE: these are only for iPhone XHR bridge and will be compiled in conditionally (eventually)
Ti._hexish = function(a){var r='';var e=a.length;var c=0;var h;while(c<e){h=a.charCodeAt(c++).toString(16);r+='\\u';var l=4-h.length;while(l-->0){r+='0'};r+=h;}return r;};
Ti._bridgeEnc = function(o){return '<'+Ti._hexish(o)+'>';};


Ti.JSON = {};
Ti.JSON.stringify=function(object,bridge)
{
	var type = typeof object;
	switch (type)
	{
		case 'undefined': case 'function': case 'unknown': return undefined;
		case 'number': case 'boolean': return object;
		case 'string':
			if (bridge===1) return Ti._bridgeEnc(object);
			return '"' + object.replace(/"/g,'"').replace(/\n/g,"\n").replace(/\r/g,"\r") + '"'; /*"*/
	}
	if((object===null) || (object.nodeType==1)) return 'null';
	if(object.constructor.toString().indexOf('Date') != -1) {
		return 'new Date(' + object.getTime() + ')';
	}
	if(object.constructor.toString().indexOf('Array') != -1)
	{
		var res='[';var pre='';var len=object.length;
		for(var i=0;i<len;i++){
			var value = object[i];
			if(value !== undefined)value=Ti.JSON.stringify(value,bridge);
			if(value !== undefined){res+=pre+value;pre=', ';}
		}
		return res + ']';
	}
	var objects = [];
	for (var prop in object)
	{
		var value = object[prop];
		if (value !== undefined){value = Ti.JSON.stringify(value,bridge);}
		if (value !== undefined){objects.push(Ti.JSON.stringify(prop,bridge) + ': ' + value);}
	}
	return '{' + objects.join(',') + '}';
};

//TODO: certain statics can be placed in by compiler such as: platform, version, etc.
//TODO: need to define setInterval, setTimeout in KJS


// right now this is defined but this could just be compiled in along with the bridge switch below
Ti._bridgeType = typeof(window)!='undefined' ? 1 : 2;

/*(function()
		{*/
			// TODO: we need to ensure that if user uses XMLHttpRequest it triggers Ti.Network.createHTTPClient dependency

			function bridgeInvoke(t,m,p,a)
			{
				//TODO: this needs to be expanded to wrap/unwrap vars on android
				//NOTE: exception throws can happen on native side since we're doing eval
				var result = null;
				var data = null;
				var args = typeof(a)!='undefined' ? Ti.JSON.stringify(a,Ti._bridgeType) : null;
				if (Ti._bridgeType!==1)
				{
					// native bridge
					data = TiBridgeInvoker(String(t),m,p,args);
				}
				else
				{
				}
				if (data!==null)
				{
					// if (m!='API') Ti.API.debug("result was ["+data+"]");
					eval(data);
				}
				return result;
			};

			function makeGetter(module,prop,cache)
			{
				if (cache!==true)
				{
					return function()
					{
						return bridgeInvoke(2,module,prop);
					};
				}
				var varname = prop+'$';
				var ns = Ti[module];
				return function()
				{
					var value = ns[varname];
					if (typeof(value)=='undefined' || value===null)
					{
						value = bridgeInvoke(2,module,prop);
						ns[varname] = value;
					}
					return value;
				};
			};

			function makeSetter(module,prop,cache)
			{
				if (cache!==true)
				{
					return function(value)
					{
						bridgeInvoke(3,module,prop,value);
						return undefined;
					};
				}
				var varname = prop+'$';
				var ns = Ti[module];
				return function(value)
				{
					ns[varname] = bridgeInvoke(3,module,prop,value);
				};
			};

			function ensureNS(module)
			{
				if (typeof(Ti[module])=='undefined')
				{
					Ti[module]={};
				}
			};

			function makeProperties(module,prop,cache,submodule)
			{
				ensureNS(module);
				submodule = (typeof submodule=='undefined') ? module : submodule;
				// defaults to not cacheable
				cache = typeof cache == 'undefined' ? false : cache;
				Ti[module].__defineGetter__(prop,makeGetter(submodule,prop,cache));
				Ti[module].__defineSetter__(prop,makeSetter(submodule,prop,cache));
			};

			var listenerId = 0;

			function makeCallback(fn)
			{
				// we check to see if we have a function id property
				// on the function and if so we just reference it
				var fid = fn.fid$;
				if (fid) return fid;

				var id = String(listenerId++);
				if (!Ti.callbacks$)
				{
					Ti.callbacks$={};
				}
				Ti.callbacks$[id]=fn;
				fn.fid$=id;
				return id;
			};

			function deleteCallback(id)
			{
				if (Ti.callbacks$)
				{
					var fn = Ti.callbacks$[id];
					delete Ti.callbacks$[id];
					if (fn)
					{
						delete fn.fid$;
					}
					//Ti.API.debug("deleted callback = "+id+" => "+typeof(fn));
				}
			};

			// defined in global so the native side can invoke it
			Ti.BridgeCallbackDelete=function(id)
			{
				//Ti.API.debug("deleting callback: "+id);
				deleteCallback(id);
			};

			// defined in global so the Native side can invoke it
			Ti.BridgeCallback=function(id,args,del)
			{
				if (Ti.callbacks$)
				{
					var fn = Ti.callbacks$[id];
					if (fn)
					{
						fn.call(fn,args);
						if (del)
						{
							deleteCallback(id);
						}
					}
				}
			};

			// called to delete the bridge proxy object
			Ti.BridgeProxyDelete=function(proxyid)
			{
				//Ti.API.debug("deleting: "+proxyId);
				try { delete Ti[proxyid]; } catch(E) { }
			};

			// called to create a bridge proxy object
			Ti.BridgeMakeProxy=function(proxyid,fns,props)
			{
				var obj = {fid$:proxyid,proxy$:true};
				Ti[proxyid]=obj;
				makeModuleFunctions(proxyid,fns);
				makeModuleProperties(proxyid,props);
				return obj;
			};

			// called to resolve a bridge proxy
			Ti.BridgeReturnProxy=function(proxyid)
			{
				return Ti[proxyid];
			};

			function makeFunction(module,prop,submodule)
			{
				ensureNS(module);
				submodule = (typeof submodule=='undefined') ? module : submodule;
				Ti[module][prop]=function()
				{
					var args = null;
					if (typeof(arguments)!='undefined')
					{
						args = [];
						for (var c=0;c<arguments.length;c++)
						{
							var arg = arguments[c];
							//TODO: move this into JSON encoder
							if (typeof(arg)=='function')
							{
								arg = makeCallback(arg);
							}
							args[c] = arg;
						}
					}
					return bridgeInvoke(1,submodule,prop,args);
				};
			};

			function makeModuleFunctions(m,f,s)
			{
				if (f)
				{
					for (var c=0;c<f.length;c++)
					{
						makeFunction(m,f[c],s);
					}
				}
			};

			function makeModuleProperties(m,p,s,cache)
			{
				if (p)
				{
					s = (typeof(s)=='undefined' || s===null) ? m : s;
					for (var c=0;c<p.length;c++)
					{
						makeProperties(m,p[c],cache,s);
					}
				}
			};

			// make some functions - this would normally be injected on compile by the compiler

			// NOTE: in the future we'll generate a hash here that will be used as jump table dispatch
			// on lookup of hash to function pointer in C++

//			makeModuleFunctions('API',['debug','info','warn','error']);
//			makeModuleFunctions('UI',['createWindow','createTableView','createView','createButton','createTabGroup','createTab','createWebView']);
//			makeModuleProperties('Platform',['displayCaps','id','availableMemory']);
//			makeModuleFunctions('Platform',['createUUID']);
//			makeModuleProperties('UI',['ANIMATION_CURVE_EASE_IN_OUT','ANIMATION_CURVE_EASE_IN','ANIMATION_CURVE_EASE_OUT','ANIMATION_CURVE_LINEAR'],null,true);

			//TODO: delegate to submodules

//		})();

