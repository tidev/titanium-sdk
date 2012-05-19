define(["Ti/_/declare", "Ti/_/Evented", "Ti/UI/Button", "Ti/Facebook", "Ti/_/lang"], function(declare, Evented, Button, Facebook, lang) {
	
	var imagePrefix = "themes/" + require.config.ti.theme + "/Facebook/",
		buttonImages = [
			"login.png", // Login normal
			"logout.png", // Logout normal
			"loginWide.png", // Login wide
			"logout.png" // Logout "wide" (really just normal)
		],
		pressedButtonImages = [
			"loginPressed.png", // Login normal pressed
			"logoutPressed.png", // Logout normal pressed
			"loginWidePressed.png", // Login wide pressed
			"logoutPressed.png" // Logout "wide" pressed (really just normal)
		];
	
	return declare("Ti.Facebook.LoginButton", Button, {
		
		constructor: function() {
			
			this._clearDefaultLook();
			this._updateImages();
			
			this._loggedInState = Facebook.loggedIn;
			
			this.addEventListener("singletap", function() {
				if (Facebook.loggedIn) {
					Facebook.logout();
				} else {
					Facebook.authorize();
				}
			});
			Facebook.addEventListener("login", lang.hitch(this,"_updateImages"));
			Facebook.addEventListener("logout", lang.hitch(this,"_updateImages"));
		},
		
		_updateImages: function() {
			this._loggedInState = Facebook.loggedIn;
			var imageIndex = 0;
			Facebook.loggedIn && (imageIndex++);
			this.style === Facebook.BUTTON_STYLE_WIDE && (imageIndex += 2);
			this.backgroundImage = imagePrefix + buttonImages[imageIndex];
			this.backgroundSelectedImage = imagePrefix + pressedButtonImages[imageIndex];
			this._hasSizeDimensions() && this._triggerLayout();
		},
		
		_getContentSize: function() {
			// Heights and widths taken directly from the image sizes.
			return {
				width: !Facebook.loggedIn && this.style === Facebook.BUTTON_STYLE_WIDE ? 318 : 144,
				height: 58
			};
		},
		
		properties: {
			style: {
				post: function() {
					this._updateImages();
				},
				value: Facebook.BUTTON_STYLE_NORMAL
			}
		}
		
	});

});