/**
* Suds: A Lightweight JavaScript SOAP Client
* Copyright: 2009 Kevin Whinnery (http://www.kevinwhinnery.com)
* License: http://www.apache.org/licenses/LICENSE-2.0.html
* Source: http://github.com/kwhinnery/Suds
*/
function SudsClient(_options) {
  function isBrowserEnvironment() {
    try {
      if (window && window.navigator) {
        return true;
      } else {
        return false;
      }
    } catch(e) {
      return false;
    }
  }

  function isAppceleratorTitanium() {
    try {
      if (Titanium) {
        return true;
      } else {
        return false;
      }
    } catch(e) {
      return false;
    }
  }
  
  //A generic extend function - thanks MooTools
  function extend(original, extended) {
    for (var key in (extended || {})) {
      if (original.hasOwnProperty(key)) {
        original[key] = extended[key];
      }
    }
    return original;
  }
  
  //Check if an object is an array
  function isArray(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
  }
  
  //Grab an XMLHTTPRequest Object
  function getXHR() {
    var xhr;
    if (isBrowserEnvironment()) {
      if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
      }
      else {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
      }
    }
    else if (isAppceleratorTitanium()) {
      xhr = Titanium.Network.createHTTPClient();
    }
    return xhr;
  }
  
  //Parse a string and create an XML DOM object
  function xmlDomFromString(_xml) {
    var xmlDoc = null;
    if (isBrowserEnvironment()) {
      if (window.DOMParser) {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(_xml,"text/xml");
      }
      else {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(_xml); 
      }
    }
    else if (isAppceleratorTitanium()) {
      xmlDoc = Titanium.XML.parseString(_xml);
    }
    return xmlDoc;
  }
  
  // Convert a JavaScript object to an XML string - takes either an
  function convertToXml(_obj, namespacePrefix) {
    var xml = '';
    if (isArray(_obj)) {
      for (var i = 0; i < _obj.length; i++) {
        xml += convertToXml(_obj[i], namespacePrefix);
      }
    } else {
      //For now assuming we either have an array or an object graph
      for (var key in _obj) {
        if (namespacePrefix && namespacePrefix.length) {
          xml += '<' + namespacePrefix + ':' + key + '>';
        } else {
          xml += '<'+key+'>';
        }
        if (isArray(_obj[key]) || (typeof _obj[key] == 'object' && _obj[key] != null)) {
          xml += convertToXml(_obj[key]);
        }
        else {
          xml += _obj[key];
        }
        if (namespacePrefix && namespacePrefix.length) {
          xml += '</' + namespacePrefix + ':' + key + '>';
        } else {
          xml += '</'+key+'>';
        }
      }
    }
    return xml;
  }
  
  // Client Configuration
  var config = extend({
    endpoint:'http://localhost',
    targetNamespace: 'http://localhost',
    envelopeBegin: '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:ns0="PLACEHOLDER" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>',
    envelopeEnd: '</soap:Body></soap:Envelope>'
  },_options);
  
  // Invoke a web service
  this.invoke = function(_soapAction,_body,_callback) {    
    //Build request body 
    var body = _body;
    
    //Allow straight string input for XML body - if not, build from object
    if (typeof body !== 'string') {
      body = '<ns0:'+_soapAction+'>';
      body += convertToXml(_body, 'ns0');
      body += '</ns0:'+_soapAction+'>';
    }

    var ebegin = config.envelopeBegin;
    config.envelopeBegin = ebegin.replace('PLACEHOLDER', config.targetNamespace);
    
    //Build Soapaction header - if no trailing slash in namespace, need to splice one in for soap action
    var soapAction = '';
    if (config.targetNamespace.lastIndexOf('/') != config.targetNamespace.length - 1) {
      soapAction = config.targetNamespace+'/'+_soapAction;
    }
    else {
      soapAction = config.targetNamespace+_soapAction;
    }
    
    //POST XML document to service endpoint
    var xhr = getXHR();
    xhr.onload = function() {
      _callback.call(this, xmlDomFromString(this.responseText));
    };
    xhr.open('POST',config.endpoint);
		xhr.setRequestHeader('Content-Type', 'text/xml');
		xhr.setRequestHeader('SOAPAction', soapAction);
		xhr.send(config.envelopeBegin+body+config.envelopeEnd);
  };
}
