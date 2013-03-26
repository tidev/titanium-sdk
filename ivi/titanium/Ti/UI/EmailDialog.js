define(["Ti/_", "Ti/_/declare", "Ti/_/Evented", "Ti/_/lang"],
	function(_, declare, Evented, lang) {

	return declare("Ti.UI.EmailDialog", Evented, {

		open: function() {
			var r = this.toRecipients || [],
				url = "mailto:" + r.join(","),
				i, j,
				fields = {
					subject: "subject",
					ccRecipients: "cc",
					bccRecipients: "bcc",
					messageBody: "body"
				},
				params = {};

			for (i in fields) {
				if (j = this[i]) {
					require.is(j, "Array") && (j = j.join(","));
					params[fields[i]] = j;
				}
			}

			this.html || params.body && (params.body = _.escapeHtmlEntities(params.body));
			params = lang.urlEncode(params);

			location.href = url + (params ? "?" + params : "");

			this.fireEvent("complete", {
				result: this.SENT,
				success: true
			});
		},
		
		isSupported: function() {
			return true;
		},

		constants: {
			CANCELLED: 0,
			FAILED: 3,
			SAVED: 1,
			SENT: 2
		},

		properties: {
		    bccRecipients: void 0,
		    ccRecipients: void 0,
		    html: false,
		    messageBody: void 0,
		    subject: void 0,
		    toRecipients: void 0
		}

	});

});
