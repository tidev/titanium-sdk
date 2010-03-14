try{
	var corkDiv = Titanium.UI.createView({backgroundColor:'#000',opacity:1,borderRadius:9,height:30,width:200,bottom:20});
	var corkLabel = Titanium.UI.createLabel({text:'Drag the photos',color:'white',font:{fontFamily:'marker felt',fontSize:15},textAlignment:'center'});
	corkDiv.add(corkLabel);
	
var messagy = function(event){
	corkLabel.setText('Value is now '+event.value);
}


	Ti.UI.currentWindow.add(corkDiv);
	
	var controlly = Ti.UI.createSlider({top:50,left:5,width:200,height:50,min:0,max:10});
//	controlly.setMin(0);
//	controlly.setMax(10);
	controlly.setThumbImage("images/KS_nav_platform.png");
	controlly.setLeftTrackImage("images/BUTT_grn_off.png");
	controlly.setRightTrackImage("images/BUTT_red_off.png");
	controlly.addEventListener('change',messagy);
	Ti.UI.currentWindow.add(controlly);

	var optional = Ti.UI.createOptionDialog({title:'Thingy!'});
	optional.show();

	var spinny = Ti.UI.createActivityIndicator({width:50,height:50});
	Ti.UI.currentWindow.add(spinny);

	var a = Titanium.UI.createButton({
		title:'Left',
		width:75,
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
	});
	a.addEventListener('click',function(e){
			var compy = Ti.UI.createEmailDialog();
			compy.setSubject('The subject!');
			compy.setToRecipients(['bhamon@appcelerator.com']);
			compy.setCcRecipients(['blainhamon@mac.com']);
			compy.setBarColor('red');
			compy.open();
		});
	var b = Titanium.UI.createButton({
		title:'Right',
		width:75,
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
	});
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	var fixedSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FIXED_SPACE,
		width:50
	});
	var tooly = Ti.UI.createToolbar({height:50,bottom:5,items:[flexSpace,a,fixedSpace,b,flexSpace]});
	Ti.UI.currentWindow.add(tooly);



}
catch(EX)
{
	Ti.API.error("Error = "+EX);
}
