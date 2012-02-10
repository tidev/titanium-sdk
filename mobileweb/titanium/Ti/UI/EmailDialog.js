define(["Ti/_", "Ti/_/declare", "Ti/_/Evented", "Ti/_/lang"],
	function(_, declare, Evented, lang) {

	var undef;

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

		constants: {
			CANCELLED: 0,
			FAILED: 3,
			SAVED: 1,
			SENT: 2
		},

		properties: {
		    bccRecipients: undef,
		    ccRecipients: undef,
		    html: false,
		    messageBody: undef,
		    subject: undef,
		    toRecipients: undef
		}

	});

});
