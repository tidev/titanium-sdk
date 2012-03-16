define(["Ti/_", "Ti/_/dom", "Ti/_/lang", "Ti/Platform"], function(_, dom, lang, Platform) {

	var global = window,
		sessionId = sessionStorage.getItem("ti:sessionId"),
		doc = document,
		cfg = require.config,
		analyticsEnabled = cfg.app.analytics,
		analyticsStorageName = "ti:analyticsEvents",
		analyticsEventSeq = 1,
		analyticsLastSent = null,
		analyticsUrl = "https://api.appcelerator.net/p/v2/mobile-web-track";

	sessionId || sessionStorage.setItem("ti:sessionId", sessionId = _.uuid());

	return _.analytics = {

		add: function(eventType, eventEvent, data, isUrgent) {
			if (analyticsEnabled) {
				// store event
				var storage = localStorage.getItem(analyticsStorageName);
					now = new Date(),
					tz = now.getTimezoneOffset(),
					atz = Math.abs(tz),
					formatZeros = function(v, n){
						var d = (v+'').length;
						return (d < n ? (new Array(++n - d)).join("0") : "") + v;
					};

				storage = storage ? JSON.parse(storage) : [];
				storage.push({
					eventId: _.uuid(),
					eventType: eventType,
					eventEvent: eventEvent,
					eventTimestamp: now.toISOString().replace('Z', (tz < 0 ? '-' : '+') + (atz < 100 ? "00" : (atz < 1000 ? "0" : "")) + atz),
					eventPayload: data
				});
				localStorage.setItem(analyticsStorageName, JSON.stringify(storage));
				this.send(isUrgent);
			}
		},

		send: function(isUrgent) {
			if (analyticsEnabled) {
				var i,
					evt,
					storage = JSON.parse(localStorage.getItem(analyticsStorageName)),
					now = (new Date()).getTime(),
					jsonStrs = [],
					ids = [];

				if (storage === null || (!isUrgent && analyticsLastSent !== null && now - analyticsLastSent < 300000 /* 5 minutes */)) {
					return;
				}

				analyticsLastSent = now;

				for (i = 0; i < storage.length; i++) {
					evt = storage[i];
					ids.push(evt.eventId);
					jsonStrs.push(JSON.stringify({
						seq: analyticsEventSeq++,
						ver: "2",
						id: evt.eventId,
						type: evt.eventType,
						event: evt.eventEvent,
						ts: evt.eventTimestamp,
						mid: Platform.id,
						sid: sessionId,
						aguid: cfg.guid,
						data: require.is(evt.eventPayload, "object") ? JSON.stringify(evt.eventPayload) : evt.eventPayload
					}));
				}

				function onSuccess() {
					// remove sent events on successful sent
					var j, k, found,
						storage = localStorage.getItem(analyticsStorageName),
						ev,
						evs = [];

					for (j = 0; j < storage.length; j++) {
						ev = storage[j];
						found = 0;
						for (k = 0; k < ids.length; k++) {
							if (ev.eventId == ids[k]) {
								found = 1;
								ids.splice(k, 1);
								break;
							}
						}
						found || evs.push(ev);
					}

					localStorage.setItem(analyticsStorageName, JSON.stringify(evs));
				}

				if (require.has("analytics-use-xhr")) {
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
					var body = doc.body,
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
							dom.destroy(form);
							dom.destroy(iframe);
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