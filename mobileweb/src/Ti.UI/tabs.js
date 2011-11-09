(function(api){
	function tabgroup(){
		this.addTab = function(){
			
		};
		this.open = function(){
			
		};
	};
	function tab(){
		
	};
	api.createTab = function(args) {
		return new tab();
	};
	api.createTabGroup = function(args) {
		return new tabgroup();
	};
	
})(Ti.UI);