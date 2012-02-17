define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/style"], function(declare, FontWidget, dom, style) {

	var setStyle = style.set;

	return declare("Ti.UI.ActivityIndicator", FontWidget, {
		
		constructor: function() {
			this._contentContainer = dom.create("div", {
				className: "TiUIActivityIndicatorContentContainer",
				style: {
					display: "none",
					boxOrient: "horizontal",
					boxPack: "center",
					boxAlign: "center",
					pointerEvents: "none",
					display: "none",
					width: "100%",
					height: "100%"
				}
			}, this.domNode);
			
			this._indicatorIndicator = dom.create("div", {
				className: "TiUIActivityIndicatorIndicator",
				style: {
					pointerEvents: "none",
					width: "36px",
					height: "36px"
				}
			}, this._contentContainer);
			
			var currentProng = 0,
				prongs = [],
				opacity = 0.3;
			for(var i = 0; i < 12; i++) {
				prongs.push(dom.create("div", {
					className: "TiUIActivityIndicatorProng",
					style: {
						position: "absolute",
						width: "4px",
						height: "10px",
						backgroundColor: "#fff",
						borderRadius: "1px",
						transform: "translate(16px,0px) rotate(" + i * 30 + "deg)",
						transformOrigin: "2px 18px",
						opacity: opacity
					}
				}, this._indicatorIndicator));
			}
			this._timer = setInterval(function(){
				var prong = prongs[currentProng];
				currentProng++;
				if (currentProng == 12) {
					currentProng = 0
				}
				setStyle(prong,"transition","");
				setTimeout(function(){
					setStyle(prong,"opacity",1);
					setTimeout(function(){
						setStyle(prong,"transition","opacity 500ms linear 0ms");
						setTimeout(function(){
							setStyle(prong,"opacity",opacity);
						},1);
					},1);
				},1);
			},100);

			this._indicatorMessage = dom.create("div", {
				className: "TiUIActivityIndicatorMessage",
				style: {
					whiteSpace: "nowrap",
					pointerEvents: "none"
				}
			}, this._contentContainer);

			this._addStyleableDomNode(this._indicatorMessage);

		},

		show: function() {
			setStyle(this._contentContainer,"display",["-webkit-box", "-moz-box"]);
		},

		hide: function() {
			setStyle(this._contentContainer,"display","none");
		},
		
		_defaultWidth: "auto",
		_defaultHeight: "auto",
		
		_messagePadding: 0,
		
		_getContentSize: function(width, height) {
			return {
				width: width === "auto" ? 36 + this._measureText(this.message, this._indicatorMessage).width + this._messagePadding : width,
				height: height === "auto" ? Math.max(this._measureText(this.message, this._indicatorMessage).height,36) : height
			};
		},
		
		properties: {
			
			message: {
				set: function(value) {
					var innerHTML = "";
					if (require.is(value,"String") && value != "") {
						this._messagePadding = 5;
						innerHTML = value;
					}
					setStyle(this._indicatorMessage,"paddingLeft", dom.unitize(this._messagePadding));
					this._indicatorMessage.innerHTML = innerHTML;
					this._hasAutoDimensions() && this._triggerParentLayout();
					return value;
				}
			},
			
			messageid: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ActivityIndicator#.messageid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ActivityIndicator#.messageid" is not implemented yet.');
					return value;
				}
			}
			
		}

	});

});