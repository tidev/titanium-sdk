define(["Ti/_", "Ti/_/dom", "Ti/_/lang", "Ti/App", "Ti/Platform"], function(_, dom, lang, App, Platform) {

	var global = window,
		sessionId = sessionStorage.getItem("ti:sessionId"),
		cfg = require.config,
		analyticsEnabled = App.analytics,
		analyticsStorageName = "ti:analyticsEvents",
		analyticsEventSeq = 0,
		analyticsLastSent = null,
		analyticsUrl = "https://api.appcelerator.net/p/v2/mobile-web-track";

	sessionId || sessionStorage.setItem("ti:sessionId", sessionId = _.uuid());

	function getStorage() {
		var s = localStorage.getItem(analyticsStorageName);
		return s ? JSON.parse(s) : []
	}

	function setStorage(data) {
		localStorage.setItem(analyticsStorageName, JSON.stringify(data));
	}	

	return _.analytics = {

		add: function(type, event, data, isUrgent) {
			if (analyticsEnabled) {
				// store event
				var storage = getStorage();
					now = new Date(),
					tz = now.getTimezoneOffset(),
					atz = Math.abs(tz),
					formatZeros = function(v, n){
						var d = (v+'').length;
						return (d < n ? (new Array(++n - d)).join("0") : "") + v;
					};

				storage.push({
					id: _.uuid(),
					type: type,
					evt: event,
					ts: now.toISOString().replace('Z', (tz < 0 ? '-' : '+') + (atz < 100 ? "00" : (atz < 1000 ? "0" : "")) + atz),
					data: data
				});
				setStorage(storage);
				this.send(isUrgent);
			}
		},

		send: function(isUrgent) {
			if (analyticsEnabled) {
				var i,
					evt,
					storage = getStorage(),
					now = (new Date()).getTime(),
					jsonStrs = [],
					ids = [];

				if (storage === null || (!isUrgent && analyticsLastSent !== null && now - analyticsLastSent < 300000 /* 5 minutes */)) {
					return;
				}

				analyticsLastSent = now;

				for (i = 0; i < storage.length; i++) {
					evt = storage[i];
					ids.push(evt.id);
					jsonStrs.push(JSON.stringify({
						id: evt.id,
						mid: Platform.id,
						rdu: null,
						type: evt.type,
						aguid: App.guid,
						event: evt.evt,
						seq: analyticsEventSeq++,
						ver: "2",
						deploytype: cfg.deployType,
						sid: sessionId,
						ts: evt.ts,
						data: /(Array|Object)/.test(require.is(evt.data)) ? JSON.stringify(evt.data) : evt.data
					}));
				}

				function onSuccess() {
					// remove sent events on successful sent
					var j, k, found,
						storage = getStorage(),
						id,
						evs = [];

					for (j = 0; j < storage.length; j++) {
						id = storage[j].id;
						found = 0;
						for (k = 0; k < ids.length; k++) {
							if (id == ids[k]) {
								found = 1;
								ids.splice(k, 1);
								break;
							}
						}
						found || evs.push(ev);
					}

					setStorage(evs);
				}

				if (require.has("ti-analytics-use-xhr")) {
					var xhr = new XmlHttpRequest;
					xhr.onreadystatechange = function() {
						if (xhr.readyState === 4 && xhr.status === 200) {
							try {
								var response = eval('(' + xhr.responseText + ')');
								response && response.success && onSuccess();
							} catch (e) {}
						}
					};
					xhr.open("POST", analyticsUrl, true);
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhr.send(lang.urlEncode({ content: jsonStrs }));
				} else {
					var body = document.body,
						rand = Math.floor(Math.random() * 1e6),
						iframeName = "analytics" + rand,
						callback = "mobileweb_jsonp" + rand,
						iframe = dom.create("iframe", {
							id: iframeName,
							name: iframeName,
							style: {
								display: "none"
							}
						}, body),
						form = dom.create("form", {
							action: analyticsUrl + "?callback=" + callback,
							method: "POST",
							style: {
								display: "none"
							},
							target: iframeName
						}, body);

					dom.create("input", {
						name: "content",
						type: "hidden",
						value: "[" + jsonStrs.join(",") + "]"
					}, form);

					global[callback] = function(response) {
						response && response.success && onSuccess();
					};

					// need to delay attaching of iframe events so they aren't prematurely called
					setTimeout(function() {
						function onIframeLoaded() {
							setTimeout(function() {
								dom.destroy(form);
								dom.destroy(iframe);
							}, 1);
						}
						iframe.onload = onIframeLoaded;
						iframe.onerror = onIframeLoaded;
						form.submit();
					}, 25);
				}
			}
		}

	};

});