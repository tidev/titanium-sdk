// NOTE: code from http://www.codeproject.com/KB/ajax/JavaScriptSOAPClient.aspx
// slight modification by appcelerator to work well with Titanium (removed IE code)

/*jslint forin: true sub: true*/

/*****************************************************************************\

Javascript "SOAP Client" library

@version: 1.4 - 2005.12.10
@author: Matteo Casati, Ihar Voitka - http://www.guru4.net/
@description: (1) SOAPClientParameters.add() method returns 'this' pointer.
			(2) "_getElementsByTagName" method added for xpath queries.
			(3) "_getXmlHttpPrefix" refactored to "_getXmlHttpProgID" (full
				ActiveX ProgID).

@version: 1.3 - 2005.12.06
@author: Matteo Casati - http://www.guru4.net/
@description: callback function now receives (as second - optional - parameter)
			the SOAP response too. Thanks to Ihar Voitka.

@version: 1.2 - 2005.12.02
@author: Matteo Casati - http://www.guru4.net/
@description: (1) fixed update in v. 1.1 for no string params.
			(2) the "_loadWsdl" method has been updated to fix a bug when
			the wsdl is cached and the call is sync. Thanks to Linh Hoang.

@version: 1.1 - 2005.11.11
@author: Matteo Casati - http://www.guru4.net/
@description: the SOAPClientParameters.toXML method has been updated to allow
			special characters ("<", ">" and "&"). Thanks to Linh Hoang.

@version: 1.0 - 2005.09.08
@author: Matteo Casati - http://www.guru4.net/
@notes: first release.

\*****************************************************************************/

function SOAPClientParameters()
{
	var _pl = [];
	this.add = function(name, value)
	{
		_pl[name] = value;
		return this;
	};
	this.toXml = function()
	{
		var xml = "";
		for(var p in _pl)
		{
			if(typeof(_pl[p]) != "function")
			{
				xml += "<" + p + ">" + _pl[p].toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</" + p + ">";
			}
		}
		return xml;
	};
}

function SOAPClient() {}

SOAPClient.invoke = function(url, method, parameters, async, callback)
{
	if(async)
	{
		SOAPClient._loadWsdl(url, method, parameters, async, callback);
	}
	else
	{
		return SOAPClient._loadWsdl(url, method, parameters, async, callback);
	}
	return 0;
};

// private: wsdl cache
SOAPClient_cacheWsdl = [];

// private: invoke async
SOAPClient._loadWsdl = function(url, method, parameters, async, callback)
{
	// load from cache?
	var wsdl = SOAPClient_cacheWsdl[url];
	if(wsdl + "" != "" && wsdl + "" != "undefined")
	{
		return SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
	}
	// get wsdl
	var xmlHttp = SOAPClient._getXmlHttp();
	xmlHttp.open("GET", url + "?wsdl");
	xmlHttp.onload = function()
	{
		SOAPClient._onLoadWsdl(url, method, parameters, async, callback, xmlHttp);
	};
	xmlHttp.onerror = function(e)
	{
		Ti.API.error('WSDL ERROR ' + e);
	};
	xmlHttp.send(null);

	//	if (!async)
	//	{
	//		return SOAPClient._onLoadWsdl(url, method, parameters, async, callback, xmlHttp);
	//	}
};
SOAPClient._onLoadWsdl = function(url, method, parameters, async, callback, req)
{
	var wsdl = req.responseXML;
	SOAPClient_cacheWsdl[url] = wsdl;	// save a copy in cache
	return SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
};
SOAPClient._sendSoapRequest = function(url, method, parameters, async, callback, wsdl)
{
	// get namespace
	var ns = (wsdl.documentElement.attributes["targetNamespace"] + "" == "undefined") ? wsdl.documentElement.attributes.getNamedItem("targetNamespace").nodeValue : wsdl.documentElement.attributes["targetNamespace"].value;
	// build SOAP request
	var sr =
				"<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
				"<soap:Envelope " +
				"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
				"xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
				"xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
				"<soap:Body>" +
				"<" + method + " xmlns=\"" + ns + "\">" +
				parameters.toXml() +
				"</" + method + "></soap:Body></soap:Envelope>";
	// send request
	var xmlHttp = SOAPClient._getXmlHttp();
	xmlHttp.onload = function()
	{
		SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
	};

	xmlHttp.open("POST", url);

	var soapaction = ((ns.lastIndexOf("/") != ns.length - 1) ? ns + "/" : ns) + method;
	xmlHttp.setRequestHeader("SOAPAction", soapaction);
	xmlHttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
	xmlHttp.send(sr);
	//	if (!async)
	//	{
	//		return SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
	//	}
};
SOAPClient._onSendSoapRequest = function(method, async, callback, wsdl, req)
{
	var o = null;
	var nd = SOAPClient._getElementsByTagName(req.responseXML, method + "Result");
	if(nd.length == 0)
	{
		if(req.responseXML.getElementsByTagName("faultcode").length > 0)
		{
			throw new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue);
		}
	}
	else
	{
		o = SOAPClient._soapresult2object(nd[0], wsdl);
	}
	if(callback)
	{
		callback(o, req.responseXML);
	}
	if(!async)
	{
		return o;
	}
};

// private: utils
SOAPClient._getElementsByTagName = function(document, tagName)
{
	try
	{
		// trying to get node omitting any namespaces (latest versions of MSXML.XMLDocument)
		return document.selectNodes(".//*[local-name()=\""+ tagName +"\"]");
	}
	catch (ex) {
	}
	// old XML parser support
	return document.getElementsByTagName(tagName);
};

SOAPClient._soapresult2object = function(node, wsdl)
{
	return SOAPClient._node2object(node, wsdl);
};

SOAPClient._node2object = function(node, wsdl)
{
	// null node
	if(node == null)
	{
		return null;
	}
	// text node
	if(node.nodeType == 3 || node.nodeType == 4)
	{
		return SOAPClient._extractValue(node, wsdl);
	}
	// leaf node
	if (node.childNodes.length == 1 && (node.childNodes[0].nodeType == 3 || node.childNodes[0].nodeType == 4))
	{
		return SOAPClient._node2object(node.childNodes[0], wsdl);
	}
	var isarray = SOAPClient._getTypeFromWsdl(node.nodeName, wsdl).toLowerCase().indexOf("arrayof") != -1;
	// object node
	if(!isarray)
	{
		var obj = null;
		if(node.hasChildNodes())
		{
			obj = {};
		}
		for(var i = 0; i < node.childNodes.length; i++)
		{
			var p = SOAPClient._node2object(node.childNodes[i], wsdl);
			obj[node.childNodes[i].nodeName] = p;
		}
		return obj;
	}
	// list node
	else
	{
		// create node ref
		var l = [];
		for(var b = 0; b < node.childNodes.length; b++)
		{
			l[l.length] = SOAPClient._node2object(node.childNodes[b], wsdl);
		}
		return l;
	}
	return null;
};

SOAPClient._extractValue = function(node, wsdl)
{
	var value = node.nodeValue;
	switch(SOAPClient._getTypeFromWsdl(node.parentNode.nodeName, wsdl).toLowerCase())
	{
		case "s:boolean":
			return value+"" == "true";
		case "s:int":
		case "s:long":
			return (value != null) ? parseInt(value + "", 10) : 0;
		case "s:double":
			return (value != null) ? parseFloat(value + "") : 0;
		case "s:datetime":
			if(value == null)
			{
				return null;
			}
			else
			{
				value = value + "";
				value = value.substring(0, value.lastIndexOf("."));
				value = value.replace(/T/gi," ");
				value = value.replace(/-/gi,"/");
				var d = new Date();
				d.setTime(Date.parse(value));
				return d;
			}
			break;
		default:
			return (value != null) ? value + "" : "";
	}
};

SOAPClient._getTypeFromWsdl = function(elementname, wsdl)
{
	var ell = wsdl.getElementsByTagName("s:element");	// IE
	if(ell.length == 0)
	{
		ell = wsdl.getElementsByTagName("element");	// MOZ
	}
	for(var i = 0; i < ell.length; i++)
	{
		if(ell[i].attributes["name"] + "" == "undefined")	// IE
		{
			if(ell[i].attributes.getNamedItem("name") != null && ell[i].attributes.getNamedItem("name").nodeValue == elementname && ell[i].attributes.getNamedItem("type") != null)
			{
				return ell[i].attributes.getNamedItem("type").nodeValue;
			}
		}
		else // MOZ
		{
			if(ell[i].attributes["name"] != null && ell[i].attributes["name"].value == elementname && ell[i].attributes["type"] != null)
			{
				return ell[i].attributes["type"].value;
			}
		}
	}
	return "";
};

// private: xmlhttp factory
SOAPClient._getXmlHttp = function()
{
	return Titanium.Network.createHTTPClient();
};