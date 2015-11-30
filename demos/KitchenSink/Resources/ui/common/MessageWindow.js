function MessageWindow() {
	var win = Titanium.UI.createWindow({
		height:30,
		width:250,
		bottom:70,
		borderRadius:10,
		touchEnabled:false,	
		//The messageWindow should take the same orientation of its parent window, 
		//we should not try specifying anything here.
		//orientationModes : [Titanium.UI.PORTRAIT]
	});
	var messageView = Titanium.UI.createView({
		id:'messageview',
		height:30,
		width:250,
		borderRadius:10,
		backgroundColor:'#000',
		opacity:0.7,
		touchEnabled:false
	});
	var messageLabel = Titanium.UI.createLabel({
		id:'messagelabel',
		text:'',
		color:'#fff',
		width:250,
		height:Ti.UI.SIZE,
		font:{
			fontFamily:'Helvetica Neue',
			fontSize:13
		},
		textAlign:'center'
	});
		
	win.add(messageView);
	win.add(messageLabel);
	
	this.setLabel = function(_text) {
		messageLabel.text = _text;
	};
	
	this.open = function(_args) {
		win.open(_args);
	};
	
	this.close = function(_args) {
		win.close(_args);
	};
}

module.exports = MessageWindow;

// function MessageWindow() {
	// this.proxy = Titanium.UI.createWindow({
		// height:30,
		// width:250,
		// bottom:70,
		// borderRadius:10,
		// touchEnabled:false,	
		// orientationModes : [
			// Titanium.UI.PORTRAIT,
			// Titanium.UI.UPSIDE_PORTRAIT,
			// Titanium.UI.LANDSCAPE_LEFT,
			// Titanium.UI.LANDSCAPE_RIGHT
		// ]
	// });
	// this.messageView = Titanium.UI.createView({
		// id:'messageview',
		// height:30,
		// width:250,
		// borderRadius:10,
		// backgroundColor:'#000',
		// opacity:0.7,
		// touchEnabled:false
	// });
	// this.messageLabel = Titanium.UI.createLabel({
		// id:'messagelabel',
		// text:'',
		// color:'#fff',
		// width:250,
		// height:'auto',
		// font:{
			// fontFamily:'Helvetica Neue',
			// fontSize:13
		// },
		// textAlign:'center'
	// });
// 		
	// this.proxy.add(this.messageView);
	// this.proxy.add(this.messageLabel);
// 	
	// return this;
// }
// 
// MessageWindow.prototype.setLabel = function(_text) {
	// Ti.API.info(this.messageLabel);
	// //Ti.API.info(this.messageLabel.text);
	// this.messageLabel.text = _text;
	// Ti.API.info(this.messageLabel);
// };
// 
// MessageWindow.prototype.open = function(_args) {
	// this.proxy.open(_args);
// };
// 
// MessageWindow.prototype.close = function(_args) {
	// this.proxy.close(_args);
// };
// 
// module.exports = MessageWindow;