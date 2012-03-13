define(["Ti/_/declare", "Ti/_/lang", "Ti/UI", "Ti/UI/View"], function(declare, lang, UI, View) {

	var sessionId = Math.random(),
		historyStack = [],
		hist = window.history,
		POP_STATE_WAITING_FOR_OPERATION = -1,
		POP_STATE_UNDOING_OPERATION = -2,
		POP_STATE_PUSHING = -3,
		POP_STATE_REWINDING_HISTORY = -4,
		POP_STATE_RESETTING = -5,
		historyPopState = POP_STATE_WAITING_FOR_OPERATION,
		startingHistoryLength = hist.length,
		prefix = location.href.split("#"), // Strip off any hash incase the user reloaded the page and a hash currently exists
		startingHash = prefix[1],
		prefix = prefix[0],
		widgetToClose;
	
	function pushToHistory(widget) {
		historyPopState = POP_STATE_PUSHING;
		historyStack.push(widget);
		location.href = prefix + "#" + sessionId + "," + widget.widgetId;
	}
	
	function removeFromHistory(widget, recursive) {
		if (historyPopState === POP_STATE_WAITING_FOR_OPERATION) {
			var historyStackIndex = historyStack.indexOf(widget);
			if (~historyStackIndex) {
				historyStack.splice(historyStackIndex,recursive ? historyStack.length - historyStackIndex : 1);
				historyPopState = POP_STATE_REWINDING_HISTORY;
				hist.go(-historyStack.length - (hist.length - startingHistoryLength - historyStack.length));
			}
		}
	}
	
	window.addEventListener("hashchange", function(e) {
		function hashIteration(){
			if (historyPopState < historyStack.length) {
				// Check if we need to skip the first state. Some browsers will view the first window as the root (i.e. they skip the hashless version), meaning we need to skip it too
				var widget = historyStack[historyPopState++],
					newLocation = prefix + "#" + sessionId + "," + widget.widgetId;
				if (location.href === newLocation) {
					hashIteration();
				} else {
					location.href = newLocation;
				}
			} else {
				var currentWidget = historyStack[historyPopState - 1];
				currentWidget && (document.title = currentWidget.title || require.config.app.name);
				historyPopState = POP_STATE_WAITING_FOR_OPERATION;
			}
		}
		if (historyPopState >= 0) {
			hashIteration();
			return;
		}
		switch(historyPopState) {
			case POP_STATE_WAITING_FOR_OPERATION: 
				// We need to undo the previous operation and redo it
				var listItem = window.location.href.split("#")[1];
				listItem && (listItem = listItem.split(",")[1]);
				if (hist.length === startingHistoryLength) {
					historyStack[0] && (listItem = historyStack[0].widgetId);
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
					if (!~historyStackIndex) {
						historyPopState = POP_STATE_WAITING_FOR_OPERATION;
						return;
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
				
				if (historyPopState === POP_STATE_WAITING_FOR_OPERATION) {
					removeFromHistory(this);
				}
				
				this.fireEvent("close");
			}
		},

		setWindowTitle: function(title) {
			document.title = title || require.config.app.name;
			return title;
		}

	});

});