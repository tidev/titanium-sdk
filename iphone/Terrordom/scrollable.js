try{
	var scrollable=Titanium.UI.createScrollableView({views:[
		Ti.UI.createView({backgroundColor:'red'}),
		Ti.UI.createView({backgroundColor:'green'}),
		Ti.UI.createView({backgroundColor:'blue'}),
		Ti.UI.createView({backgroundColor:'yellow'}),
		Ti.UI.createView({backgroundColor:'purple'})	
	], showPagingControl:true});
	Ti.UI.currentWindow.add(scrollable);
	
	scrollable.addEventListener('scroll',function(e){
			Ti.API.debug("Scrolled to " + e.view.backgroundColor);
			if (e.view.backgroundColor == 'purple') scrollable.scrollToView(0);
		});
	
	
}
catch(EX)
{
	Ti.API.error("Error = "+EX);
}
