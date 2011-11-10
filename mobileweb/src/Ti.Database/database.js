(function(api){
	// Interfaces
	Ti._5.EventDriven(api);
	// Methods
	api.install = function(){
		console.debug('Method "Titanium.Database.install" is not implemented yet.');
	};
	api.open = function(name, version, desc, size) {
		return new api.DB({
			name: name,
			version: version,
			desc: desc,
			size: size
		});
	};
})(Ti._5.createClass('Ti.Database'));
