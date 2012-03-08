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
		prefix = location.href;
	
	function pushToHistory(widget) {
		historyPopState = POP_STATE_PUSHING;
		historyStack.push(widget);
		location.href = prefix + "#" + (widget.title || widget.widgetId);
	}
	
	function removeFromHistory(widget) {
		if (historyStack.length > 0 && historyPopState === POP_STATE_WAITING_FOR_OPERATION) {
			var historyStackIndex = historyStack.indexOf(widget);
			if (historyStackIndex !== -1) {
				historyStack.splice(historyStackIndex,historyStack.length - historyStackIndex);
				historyPopState = POP_STATE_REWINDING_HISTORY;
				hist.go(-historyStack.length - 1);
			}
		}
	}
	
	window.addEventListener("popstate", function(e) {
		switch(historyPopState) {
			case POP_STATE_WAITING_FOR_OPERATION: 
				// We need to undo the previous operation and redo it
				var listItem = window.location.href.split("#")[1];
				if (listItem) {
					historyPopState = POP_STATE_UNDOING_OPERATION;
					hist.forward();
				}
				break;
			case POP_STATE_UNDOING_OPERATION:
				var widget = historyStack[historyStack.length - 1];
				historyPopState = POP_STATE_WAITING_FOR_OPERATION;
				widget.close();
				break;
			case POP_STATE_PUSHING: 
				historyPopState = POP_STATE_WAITING_FOR_OPERATION;
				break;
			case POP_STATE_REWINDING_HISTORY:
				historyPopState = POP_STATE_RESETTING;
				location.href = prefix + "#_history_reset";
				break;
			case POP_STATE_RESETTING: 
				historyPopState = 0;
				hist.back();
				break;
			default: 
				if (historyPopState < historyStack.length) {
					var widget = historyStack[historyPopState++];
					location.href = prefix + "#" + (widget.title || widget.widgetId);
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
				
				removeFromHistory(this);
				
				this.fireEvent("close");
			}
		},

		setWindowTitle: function(title) {
			historyStack[historyStack.length-1] === this && (document.title = title || require.config.project.name);
			return title;
		}

	});

});