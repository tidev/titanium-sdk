try{
	var scrollable=Titanium.UI.createScrollView({contentHeight:'auto',contentWidth:'auto'
//	,showHorizontalScrollIndicator:false,showVerticalScrollIndicator:false
	});

	scrollable.add(Titanium.UI.createView({backgroundColor:'red',top:250,height:250,left:250,width:250}));

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
