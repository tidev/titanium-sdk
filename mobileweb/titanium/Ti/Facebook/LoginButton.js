define(["Ti/_/declare", "Ti/_/Evented", "Ti/UI/Button", "Ti/Facebook", "Ti/_/lang"], function(declare, Evented, Button, Facebook, lang) {
	
	var imagePrefix = "themes/titanium/Facebook/",
		buttonImages = [
			imagePrefix + "login.png", // Login normal
			imagePrefix + "logout.png", // Logout normal
			imagePrefix + "loginWide.png", // Login wide
			imagePrefix + "logout.png" // Logout "wide" (really just normal)
		],
		pressedButtonImages = [
			imagePrefix + "loginPressed.png", // Login normal pressed
			imagePrefix + "logoutPressed.png", // Logout normal pressed
			imagePrefix + "loginWidePressed.png", // Login wide pressed
			imagePrefix + "logoutPressed.png" // Logout "wide" pressed (really just normal)
		];
		loginImage = imagePrefix + "login.png",
		loginPressedImage = 
		logoutImage = imagePrefix + "logoutImage.png",
		logoutPressedImage = imagePrefix + "logoutPressedImage.png";
	
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
			Facebook.addEventListener("login", lang.hitch(this,this._updateImages));
			Facebook.addEventListener("logout", lang.hitch(this,this._updateImages));
		},
		
		_updateImages: function() {
			this._loggedInState = Facebook.loggedIn;
			var imageIndex = 0;
			Facebook.loggedIn && (imageIndex++);
			this.style === Facebook.BUTTON_STYLE_WIDE && (imageIndex += 2);
			this.backgroundImage = buttonImages[imageIndex];
			this.backgroundSelectedImage = pressedButtonImages[imageIndex];
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