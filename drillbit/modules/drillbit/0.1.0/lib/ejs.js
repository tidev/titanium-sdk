/*--------------------------------------------------------------------------
 *  EJS - Embedded JavaScript, version 0.1.0
 *  Copyright (c) 2007 Edward Benson
 *  http://www.edwardbenson.com/projects/ejs
 *  ------------------------------------------------------------------------
 *
 *  EJS is freely distributable under the terms of an MIT-style license.
 *
 *  EJS is a client-side preprocessing engine written in and for JavaScript.
 *  If you have used PHP, ASP, JSP, or ERB then you get the idea: code embedded
 *  in <% // Code here %> tags will be executed, and code embedded in <%= .. %> 
 *  tags will be evaluated and appended to the output. 
 * 
 *  This is essentially a direct JavaScript port of Masatoshi Seki's erb.rb 
 *  from the Ruby Core, though it contains a subset of ERB's functionality. 
 * 
 *  Requirements:
 *      prototype.js
 * 
 *  Usage:
 *      // source should be either a string or a DOM node whose innerHTML
 *      // contains EJB source.
 *  	var source = "<% var ejb="EJB"; %><h1>Hello, <%= ejb %>!</h1>"; 
 *      var compiler = new EjsCompiler(source);		
 *	    compiler.compile();	
 *	    var output = eval(compiler.out);
 *      alert(output); // -> "<h1>Hello, EJB!</h1>"
 *       
 *  For a demo:      see demo.html
 *  For the license: see license.txt
 *
 *--------------------------------------------------------------------------*/

/* Make a split function like Ruby's: "abc".split(/b/) -> ['a', 'b', 'c'] */
String.prototype.rsplit = function(regex) {
	var item = this;
	var result = regex.exec(item);
	var retArr = new Array();
	while (result != null)
	{
		var first_idx = result.index;
		var last_idx = regex.lastIndex;
		if ((first_idx) != 0)
		{
			var first_bit = item.substring(0,first_idx);
			retArr.push(item.substring(0,first_idx));
			item = item.slice(first_idx);
		}		
		retArr.push(result[0]);
		item = item.slice(result[0].length);
		result = regex.exec(item);	
	}
	if (! item == '')
	{
		retArr.push(item);
	}
	return retArr;
};

/* Chop is nice to have too */
String.prototype.chop = function() {
	return this.substr(0, this.length - 1);
}

/* Adaptation from the Scanner of erb.rb  */
var EjsScanner = function(source, left, right) {
	this.left_delimiter = 	left +'%'	//<%
	this.right_delimiter = 	'%'+right	//>
	this.double_left = 		left+'%%'
	this.double_right = 	'%%'+right
	this.left_equal = 		left+'%='
	this.left_comment = 	left+'%#'
	if(left=='[')
		this.SplitRegexp = /(\[%%)|(%%\])|(\[%=)|(\[%#)|(\[%)|(%\]\n)|(%\])|(\n)/;
	else
		this.SplitRegexp = new RegExp('('+this.double_left+')|(%%'+this.double_right+')|('+this.left_equal+')|('+this.left_comment+')|('+this.left_delimiter+')|('+this.right_delimiter+'\n)|('+this.right_delimiter+')|(\n)') 
	
	this.source = source;
	this.stag = null;
	this.lines = 0;
};
EjsView = function(data){
	this.data = data
}
EjsView.prototype.partial = function(options, data){
	if(!data) data = this.data;
	return new EJS(options).render(data);
}

EjsScanner.to_text = function(input){
	if(input == null || input === undefined)
        return '';
    if(input instanceof Date)
		return input.toDateString();
	if(input.toString) 
        return input.toString()
	return '';
}

EjsScanner.prototype = {

  /* For each line, scan! */
  scan: function(block) {
     scanline = this.scanline;
	 regex = this.SplitRegexp;
	 if (! this.source == '')
	 {
	 	 var source_split = this.source.rsplit(/\n/);
	 	 for(var i=0; i<source_split.length; i++) {
		 	 var item = source_split[i];
			 this.scanline(item, regex, block);
		 }
	 }
  },
  
  /* For each token, block! */
  scanline: function(line, regex, block) {
	 this.lines++
	 var line_split = line.rsplit(regex);
 	 for(var i=0; i<line_split.length; i++) {
	   var token = line_split[i];
       if (token != null) {
		   	try{
	         	block(token, this);
		 	}catch(e){
				throw {type: 'EjsScanner', line: this.lines}
			}
       }
	 }
  }
};

/* Adaptation from the Buffer of erb.rb  */
var EjsBuffer = function(pre_cmd, post_cmd) {
	this.line = new Array();
	this.script = "";
	this.pre_cmd = pre_cmd;
	this.post_cmd = post_cmd;
	
	for (var i=0; i<this.pre_cmd.length; i++)
	{
		this.push(pre_cmd[i]);
	}
}
EjsBuffer.prototype = {
	
  push: function(cmd) {
	this.line.push(cmd);
  },

  cr: function() {
	this.script = this.script + this.line.join('; ');
	this.line = new Array();
	this.script = this.script + "\n";
  },

  close: function() {
	if (this.line.length > 0)
	{
		for (var i=0; i<this.post_cmd.length; i++)
		{
			this.push(pre_cmd[i]);
		}
		this.script = this.script + this.line.join('; ');
		line = null;
	}
  }
 	
};

/* Adaptation from the Compiler of erb.rb  */
EjsCompiler = function(source, left) {
	this.pre_cmd = ['___ejsO = "";'];
	this.post_cmd = new Array();
	this.source = ' ';	
	if (source != null)
	{
		if (typeof source == 'string')
		{
		    source = source.replace(/\r\n/g, "\n");
            source = source.replace(/\r/g,   "\n");
			this.source = source;
		}
		else if (source.innerHTML)
		{
			this.source = source.innerHTML;
		} 
		if (typeof this.source != 'string')
		{
			this.source = "";
		}
	}
	left = left || '<'
	var right = '>'
	switch(left) {
		case '[':
			right = ']'
			break;
		case '<':
			break;
		default:
			throw left+' is not a supported deliminator'
			break;
	}
	this.scanner = new EjsScanner(this.source, left, right);
	this.out = '';
}
EjsCompiler.prototype = {
  compile: function(options) {
  	options = options || {};
	this.out = '';
	var put_cmd = "___ejsO += ";
	var insert_cmd = put_cmd;
	var buff = new EjsBuffer(this.pre_cmd, this.post_cmd);		
	var content = '';
	var clean = function(content)
	{
	    content = content.replace(/\\/g, '\\\\');
        content = content.replace(/\n/g, '\\n');
        content = content.replace(/"/g,  '\\"');
        return content;
	} 
	this.scanner.scan(function(token, scanner) {
		if (scanner.stag == null)
		{
			//alert(token+'|'+(token == "\n"))
			switch(token) {
				case '\n':
					content = content + "\n";
					buff.push(put_cmd + '"' + clean(content) + '";');
					buff.cr()
					content = '';
					break;
				case scanner.left_delimiter:
				case scanner.left_equal:
				case scanner.left_comment:
					scanner.stag = token;
					if (content.length > 0)
					{
						// Chould be content.dump in Ruby
						
						buff.push(put_cmd + '"' + clean(content) + '"');
					}
					content = '';
					break;
				case scanner.double_left:
					content = content + scanner.left_delimiter;
					break;
				default:
					content = content + token;
					break;
			}
		}
		else {
			switch(token) {
				case scanner.right_delimiter:
					switch(scanner.stag) {
						case scanner.left_delimiter:
							if (content[content.length - 1] == '\n')
							{
								content = content.chop();
								buff.push(content);
								buff.cr();
							}
							else {
								buff.push(content);
							}
							break;
						case scanner.left_equal:
							buff.push(insert_cmd + "(EjsScanner.to_text(" + content + "))");
							break;
					}
					scanner.stag = null;
					content = '';
					break;
				case scanner.double_right:
					content = content + scanner.right_delimiter;
					break;
				default:
					content = content + token;
					break;
			}
		}
	});
	if (content.length > 0)
	{
		// Chould be content.dump in Ruby
		buff.push(put_cmd + '"' + clean(content) + '"');
	}
	buff.close();
	this.out = buff.script + ";";
	var to_be_evaled = 'this.process = function(_CONTEXT,_VIEW) { try { with(_VIEW) { with (_CONTEXT) {'+this.out+" return ___ejsO;}}}catch(e){e.lineNumber=null;throw e;}};";
	
	try{
		eval(to_be_evaled);
	}catch(e){
		if(typeof JSLINT != 'undefined'){
			JSLINT(this.out)
			for(var i = 0; i < JSLINT.errors.length; i++){
				var error = JSLINT.errors[i];
				if(error.reason != "Unnecessary semicolon."){
					error.line++;
					var e = new Error();
					e.lineNumber = error.line;
					e.message = error.reason;
					if(options.url)
						e.fileName = options.url;
					throw e;
				}
			}
		}else{
			throw e;
		}
	}
  }
}


//type, cache, folder
EJS = function( options ){
	this.set_options(options)
	
	if(options.url){
		var template = EJS.get(options.url, this.cache)
		if (template) return template;
	    if (template == EJS.INVALID_PATH) return null;
		this.text = EJS.request(options.url)
		if(this.text == null){
			//EJS.update(options.url, this.INVALID_PATH);
			throw 'There is no template at '+options.url
		}
		this.name = options.url
	}
	else if (options.text)
	{
		this.text = options.text;
		this.name = options.name;
	}
	else if(options.element)
	{
		if(typeof options.element == 'string'){
			var name = options.element
			options.element = document.getElementById(  options.element )
			if(options.element == null) throw name+'does not exist!'
		}
		if(options.element.value){
			this.text = options.element.value
		}else{
			this.text = options.element.innerHTML
		}
		this.name = options.element.id
		this.type = '['
	}
	var template = new EjsCompiler(this.text, this.type);

	template.compile(options);

	
	EJS.update(this.name, this);
	this.template = template
}
EJS.config = function(options){
	EJS.cache = options.cache != null ? options.cache : EJS.cache
	EJS.type = options.type != null ? options.type : EJS.type
	var templates_directory = {} //nice and private container
	
	EJS.get = function(path, cache){
		if(cache == false) return null;
		if(templates_directory[path]) return templates_directory[path];
  		return null;
	}
	
	EJS.update = function(path, template) { 
		if(path == null) return;
		templates_directory[path] = template 
	}
	
	EJS.INVALID_PATH =  -1;
	
	
}
EJS.config( {cache: true, type: '<' } )

EJS.prototype = {
	render : function(object){
		var v = new EjsView(object);
		return this.template.process.call(v, object,v);
	},
	out : function(){
		return this.template.out
	},
	set_options : function(options){
		this.type = options.type != null ? options.type : EJS.type
		this.cache = options.cache != null ? options.cache : EJS.cache
		this.text = options.text != null ? options.text : null
		this.name = options.name != null ? options.name : null
	},
	// called without options, returns a function that takes the object
	// called with options being a string, uses that as a url
	// called with options as an object
	update : function(element, options){
		if(typeof element == 'string'){
			element = document.getElementById(element)
		}
		if(options == null){
			_template = this;
			return function(object){
				EJS.prototype.update.call(_template, element, object)
			}
		}
		if(typeof options == 'string'){
			params = {}
			params.url = options
			_template = this;
			params.onComplete = function(request){
				var object = eval( request.responseText )
				EJS.prototype.update.call(_template, element, object)
			}
			EJS.ajax_request(params)
		}else
		{
			element.innerHTML = this.render(options)
		}
	}
}

	EJS.newRequest = function(){
	   var factories = [function() { return Titanium.Network.createHTTPClient(); }, function() { return new ActiveXObject("Msxml2.XMLHTTP"); },function() { return new XMLHttpRequest(); },function() { return new ActiveXObject("Microsoft.XMLHTTP"); }];
	   for(var i = 0; i < factories.length; i++) {
	        try {
	            var request = factories[i]();
	            if (request != null)  return request;
	        }
	        catch(e) { continue;}
	   }
	}
	
	EJS.request = function(path){
	   var request = new EJS.newRequest()
	   request.open("GET", path, false);
	   
	   try{request.send(null);}
	   catch(e){return null;}
	   
	   if ( request.status == 404 || request.status == 2 ||(request.status == 0 && request.responseText == '') ) return null;
	   
	   return request.responseText
	}
	EJS.ajax_request = function(params){
		params.method = ( params.method ? params.method : 'GET')
		
		var request = new EJS.newRequest();
		request.onreadystatechange = function(){
			if(request.readyState == 4){
				if(request.status == 200){
					params.onComplete(request)
				}else
				{
					params.onComplete(request)
				}
			}
		}
		request.open(params.method, params.url)
		request.send(null)
	}
//}


Titanium.EJS = EJS;