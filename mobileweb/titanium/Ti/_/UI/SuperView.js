define(["Ti/_/declare", "Ti/_/dom", "Ti/_/lang", "Ti/UI", "Ti/UI/View"], function(declare, dom, lang, UI, View) {

	var sessionId = Math.random(),historyStack = [],
		pageNum = 1,
		hist = window.history,
		POP_STATE_WAITING_FOR_OPERATION = -1,
		POP_STATE_UNDOING_OPERATION = -2,
		POP_STATE_PUSHING = -3,
		POP_STATE_REWINDING_HISTORY = -4,
		POP_STATE_RESETTING = -5,
		historyPopState = POP_STATE_WAITING_FOR_OPERATION,
		prefix = location.href.split("#")[0], // Strip off any hash incase the user reloaded the page and a hash currently exists
		widgetToClose;
	
	function pushToHistory(widget) {
		historyPopState = POP_STATE_PUSHING;
		historyStack.push(widget);
		location.href = prefix + "#" + widget.widgetId;
	}
	
	function removeFromHistory(widget, recursive) {
		if (historyPopState === POP_STATE_WAITING_FOR_OPERATION) {
			var historyStackIndex = historyStack.indexOf(widget);
			if (historyStackIndex !== -1) {
				historyStack.splice(historyStackIndex,recursive ? historyStack.length - historyStackIndex : 1);
				historyPopState = POP_STATE_REWINDING_HISTORY;
				hist.go(-historyStack.length - 1);
			}
		}
	}
	
	window.addEventListener("hashchange", function(e) {
		switch(historyPopState) {
			case POP_STATE_WAITING_FOR_OPERATION: 
				// We need to undo the previous operation and redo it
				var listItem = window.location.href.split("#")[1];
				if (prefix === window.location.href) {
					listItem = historyStack[0].widgetId;
				}
				if (listItem) {
					var historyStackIndex = -1,
						historyStackLength = historyStack.length,
						widget;
					historyPopState = POP_STATE_UNDOING_OPERATION;
					for (var i = 0; i < historyStackLength; i++) {
						widget = historyStack[i];
						if (listItem === widget.widgetId) {
							historyStackIndex = i + 1;
							break;
						}
					}
					for (i = historyStackIndex; i < historyStackLength; i++) {
						historyStack[i].close();
					}
					widgetToClose = historyStack[historyStackIndex];
					hist.go(historyStackLength - historyStackIndex);
				}
				break;
			case POP_STATE_UNDOING_OPERATION:
				historyPopState = POP_STATE_WAITING_FOR_OPERATION;
				removeFromHistory(widgetToClose, true);
				break;
			case POP_STATE_PUSHING: 
				historyPopState = POP_STATE_WAITING_FOR_OPERATION;
				break;
			case POP_STATE_REWINDING_HISTORY:
				historyPopState = POP_STATE_RESETTING;
				location.href = prefix + "#history_reset";
				break;
			case POP_STATE_RESETTING: 
				historyPopState = 0;
				hist.back();
				break;
			default: 
				if (historyPopState < historyStack.length) {
					var widget = historyStack[historyPopState++];
					location.href = prefix + "#" + widget.widgetId;
				} else {
					historyPopState = POP_STATE_WAITING_FOR_OPERATION;
				}
				break;
		}
	});

	return declare("Ti._.UI.SuperView", View, {

		constructor: function() {
			this.addEventListener("focus", lang.hitch(this, function() {
				this.setWindowTitle(this.title);
			}));
		},

		destroy: function() {
			this.close();
			View.prototype.destroy.apply(this, arguments);
		},

		open: function(args) {
			if (!this._opened) {
				this._opened = 1;
				UI._addWindow(this, 1).show();
				
				pushToHistory(this);

				this.fireEvent("open");
				this.fireEvent("focus", this._state);
			}
		},

		close: function(args) {
			if (this._opened) {
				this._opened = 0;
				UI._removeWindow(this);
				
				if (this === historyStack[historyStack.length - 1]) {
					var newTopWindow = historyStack[historyStack.length - 2];
					newTopWindow && this.setWindowTitle(newTopWindow.title);
				}
				if (historyPopState === POP_STATE_WAITING_FOR_OPERATION) {
					removeFromHistory(this);
				}
				
				this.fireEvent("close");
			}
		},

		setWindowTitle: function(title) {
			historyStack[historyStack.length - 1] === this && (document.title = title || require.config.app.name);
			return title;
		}

	});

});