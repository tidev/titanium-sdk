define("Ti/_/UI/SuperView", ["Ti/_/declare", "Ti/_/dom", "Ti/UI", "Ti/UI/View"], function(declare, dom, UI, View) {

	var windows = [];

	require.on(window, "popstate", function(evt) {
		var win;
		evt && evt.state && evt.state.screenIndex !== null && (win = windows[evt.state.windowIdx]) && win.open({ isBack:1 });
	});

	return declare("Ti._.UI.SuperView", View, {

		_windowIdx: null,
		_opened: 0,

		constructor: function() {
			this._windowIdx = windows.length;
			windows.push(this);
		},

		destroy: function() {
			windows[this._windowIdx] = null;
			View.prototype.destroy.apply(this, arguments);
		},

		open: function(arg) {
			if (!this._opened) {
				this._opened = 1;
				this.parent || UI.rootNode.appendChild(this.domNode);
				this.show();
				!arg || !arg.isBack || window.history.pushState({ windowIdx: this._windowIdx }, "", "");
			}
		},

		close: function() {
			if (this._opened) {
				this._opened = 0;
				UI.rootNode.removeChild(this.domNode);
			}
		}

	});

});