define(["Ti/_", "Ti/_/dom", "Ti/_/has", "Ti/_/lang", "Ti/App", "Ti/Platform"],
	function(_, dom, has, lang, App, Platform) {

	var global = window,
		is = require.is,
		analyticsEnabled = App.analytics,
		analyticsLastSent = null,
		analyticsUrl = "https://api.appcelerator.com/p/v3/mobile-web-track/" + App.guid,
		pending = {},
		sendTimer,
		sendDelay = 60000,
		analytics = {
			add: function(type, event, data, isUrgent) {
				if (analyticsEnabled) {
					// store event
					var storage = getStorage();

					storage.push({
						id: _.uuid(),
						type: type,
						evt: event,
						ts: (new Date).toISOString().replace('Z', "+0000"),
						data: data
					});

					setStorage(storage);
					this.send(isUrgent);
				}
			},

			send: function(isUrgent) {
				if (analyticsEnabled) {
					var rand = Math.floor(Math.random() * 1e6),
						now = Date.now(),
						ids = [],
						payload = [],
						sessionId = sessionStorage.getItem("ti:sessionId"),
						seqId = sessionStorage.getItem("ti:analyticsSeqId"),
						events = getStorage(),
						i = 0,
						len = events.length,
						evt,
						eventData,
						buildType = require.config.ti.buildType;

					typeof seqId == 'string' && (seqId = JSON.parse(seqId));

					clearTimeout(sendTimer);

					if (len && (isUrgent || analyticsLastSent == null || now - analyticsLastSent >= sendDelay)) {
						sessionId || (sessionId = _.uuid());
						seqId == null && (seqId = 0);

						while (i < len) {
							evt = events[i++];

							ids.push(evt.id);

							payload.push(eventData = {
								id: evt.id,
								mid: Platform.id,
								rdu: null,
								type: evt.type,
								aguid: App.guid,
								event: evt.evt,
								seq: seqId++,
								ver: "2",
								deploytype: App.deployType,
								sid: sessionId,
								ts: evt.ts,
								data: evt.data
							});

							buildType && (eventData.buildType = buildType);

							if (evt.type == 'ti.end') {
								seqId = 0;
								sessionId = _.uuid();
							}
						}

						sessionStorage.setItem("ti:sessionId", sessionId);
						sessionStorage.setItem("ti:analyticsSeqId", seqId);

						pending[rand] = ids;
						analyticsLastSent = now;
						payload = JSON.stringify(payload);

						if (has('ti-analytics-use-xhr')) {
							var xhr = new XMLHttpRequest;
							xhr.onreadystatechange = function() {
								if (xhr.readyState == 4 && xhr.status == 200) {
									try {
										var data = JSON.parse(xhr.responseText);
										data.callback = rand;
										onSuccess(data);
									} catch (e) {}
								}
							};
							xhr.open("POST", analyticsUrl, true);
							xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
							xhr.send('content=' + encodeURIComponent(payload));
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
								value: payload
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

					sendTimer = setTimeout(function() {
						analytics.send(1);
					}, sendDelay);
				}
			}
		};

	function getStorage() {
		var s = localStorage.getItem("ti:analyticsEvents");
		return s ? JSON.parse(s) : [];
	}

	function setStorage(data) {
		localStorage.setItem("ti:analyticsEvents", JSON.stringify(data));
	}

	function onSuccess(data) {
		if (data && typeof data == 'object' && data.success) {
			var ids = pending[data.callback],
				keepers = [],
				events = getStorage(),
				i = 0,
				len = events.length,
				evt;

			if (ids) {
				while (i < len) {
					evt = events[i++];
					~ids.indexOf(evt.id) || keepers.push(evt);
				}
				setStorage(keepers);
			}
		}
	}

	require.on(global, 'message', function (response) {
		onSuccess(response.data);
	});

	return analytics;

});