define("Ti/Utils", ["Ti/_/Evented"], function(Evented) {

	(function(api){
		// Interfaces
		Ti._5.EventDriven(api);
		
		function _clone(oSource) {
			if(!oSource || 'object' !== typeof oSource)  {
				return oSource;
			}
			var oClone = 'function' === typeof oSource.pop ? [] : {};
			var sIndex = null;
			for(sIndex in oSource) {
				if(oSource.hasOwnProperty(sIndex)) {
					var oProp = oSource[sIndex];
					if(oProp && 'object' === typeof oProp) {
						oClone[sIndex] = _clone(oProp);
					} else {
						oClone[sIndex] = oProp;
					}
				}
			}
			return oClone;
		}
	
		var _DOMParser = new DOMParser();
		api.DOMDocument = null;
		
		function _NodeList() {
			var _nodes = [];
	
			Ti._5.prop(this, 'length', {
				get: function() {return _nodes.length}
			});
		
			this.item = function (iIndex) {
				return _nodes[iIndex]; 
			}
			this.add = function (oNode) {
				_nodes.push(oNode);
			}
			this.remove = function (oNode) {
				for (var iCounter=_nodes.length; iCounter--;) {
					if (oNode == _nodes[iCounter]) {
						_nodes.splice(iCounter,1);
					}
				}
			}
		}
		
		function _addEvaluate(oNode) {
			oNode.evaluate = function (xml) {
				tempXPathResult = _DOMParser.parseFromString(_serialize1Node(oNode),"text/xml");
				var oNodes = tempXPathResult.evaluate(xml, tempXPathResult, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
				var oResult = new _NodeList();
				var oTemp = null;
				if (oNodes) {
					while (oTemp = oNodes.iterateNext()) {
						oResult.add(_nodeWrapper(oTemp));
					}
				}
				return oResult;
			};
			return oNode;
		}
		
		function _nodeWrapper(oNode) {
			if (!oNode.nodeValue) {
				oNode.nodeValue = oNode;
			}
			if (!oNode.text) {
				oNode.text = oNode.nodeValue;
			}
			
			return _addEvaluate(oNode);
		}
		
		// Methods
		api.parseString = function(xml) {
			domDocument = _DOMParser.parseFromString(xml.replace(/>\s*</gi, "><"),"text/xml");
			var oResult = domDocument.firstChild || domDocument;
	
			// Add some functionality for compatibility with Mobile SDK
			oResult = _addEvaluate(oResult);
			oResult.documentElement = _addEvaluate(domDocument.documentElement);
			oResult.getElementsByTagName = function (sName) {
				return oResult.parentNode ? oResult.parentNode.getElementsByTagName(sName) : oResult.getElementsByTagName(sName);
			}
			
			return api.DOMDocument = oResult;
		};
		
		function _serialize1Node (node) {
			if ('undefined' != typeof node.outerHTML) {
				return node.outerHTML;
			}
			
			if ('undefined' != typeof XMLSerializer) {
				var serializer = new XMLSerializer();
				return serializer.serializeToString(node);
			} else if (node.xml) {
				return node.xml;
			} else {
				var oNode = document.createElement("div");
				oNode.appendChild(node);
				return oNode.innerHTML;
			}
		};
		
		api.serializeToString = function (nodeList) {
			if ('array' != typeof nodeList && '[object NodeList]' !== nodeList.toString()) {
				return _serialize1Node(nodeList);
			}
			var sResult = "";
			for (var iCounter=0; iCounter < nodeList.length; iCounter++) {
				sResult += _serialize1Node(nodeList[iCounter]);
			}
			return sResult;
		}
		
	})(Ti._5.createClass('Ti.XML'));

});