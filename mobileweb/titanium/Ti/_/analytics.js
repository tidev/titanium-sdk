define(["Ti/_", "Ti/_/dom", "Ti/_/lang", "Ti/App", "Ti/Platform"], function(_, dom, lang, App, Platform) {

	var global = window,
		sessionId = sessionStorage.getItem("ti:sessionId"),
		is = require.is,
		cfg = require.config,
		analyticsEnabled = App.analytics,
		analyticsStorageName = "ti:analyticsEvents",
		analyticsEventSeq = 0,
		analyticsLastSent = null,
		analyticsUrl = "https://api.appcelerator.net/p/v2/mobile-web-track",
		pending = {};

	sessionId || sessionStorage.setItem("ti:sessionId", sessionId = _.uuid());

	function getStorage() {
		var s = localStorage.getItem(analyticsStorageName);
		return s ? JSON.parse(s) : []
	}

	function setStorage(data) {
		localStorage.setItem(analyticsStorageName, JSON.stringify(data));
	}	

	function onSuccess(response) {
		if (is(response.data, "Object") && response.data.success) {
			var ids = pending[response.data.callback],
				keepers = [];
			if (ids) {
				getStorage().forEach(function(evt) {
					~ids.indexOf(evt.id) || keepers.push(evt);
				});
				setStorage(keepers);
			}
		}
	}

	require.on(global, "message", onSuccess);

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
				var rand = Math.floor(Math.random() * 1e6),
					now = (new Date()).getTime(),
					ids = [],
					jsonStrs = [];

				if (!isUrgent && analyticsLastSent !== null && now - analyticsLastSent < 60000 /* 1 minute */) {
					return;
				}

				analyticsLastSent = now;

				getStorage().forEach(function(evt) {
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
						deploytype: cfg.app.deployType,
						sid: sessionId,
						ts: evt.ts,
						data: /(Array|Object)/.test(is(evt.data)) ? JSON.stringify(evt.data) : evt.data
					}));
				});

				pending[rand] = ids;

				if (require.has("analytics-use-xhr")) {
					var xhr = new XmlHttpRequest;
					xhr.onreadystatechange = function() {
						if (xhr.readyState === 4 && xhr.status === 200) {
							try {
								onSuccess({ data: eval('(' + xhr.responseText + ')') });
							} catch (e) {}
						}
					};
					xhr.open("POST", analyticsUrl, true);
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhr.send(lang.urlEncode({ content: jsonStrs }));
				} else {
					var body = document.body,
						iframeName = "analytics" + rand,
						iframe = dom.create("iframe", {
							id: iframeName,
							name: iframeName,
							style: {
								display: "none"
							}
						}, body),
						form = dom.create("form", {
							action: analyticsUrl + "?callback=" + rand + "&output=html",
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