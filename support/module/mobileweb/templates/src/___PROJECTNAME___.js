define(["Ti/_/lang"], function(lang) {

	return lang.setObject("___PROJECTNAME___", {
		example: function() {
			return "hello world";
		},

		properties: {
			exampleProp: "hello world"
		}
	});

});