function genTest(win){
	var listView = Ti.UI.createListView({height:'90%', top:0});
	var sections = [];
 
	var fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits'});
	var fruitDataSet = [
    	{properties: { title: 'Apple'}},
    	{properties: { title: 'Banana'}},
    	{properties: { title: 'Cantaloupe'}},
    	{properties: { title: 'Fig'}},
    	{properties: { title: 'Guava'}},
    	{properties: { title: 'Kiwi'}},
	];
	fruitSection.setItems(fruitDataSet);
	sections.push(fruitSection);
 
	var vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables'});
	var vegDataSet = [
	    {properties: { title: 'Carrots'}},
	    {properties: { title: 'Potatoes'}},
	    {properties: { title: 'Corn'}},
	    {properties: { title: 'Beans'}},
	    {properties: { title: 'Tomato'}},
	];
	vegSection.setItems(vegDataSet);
 
	var fishSection = Ti.UI.createListSection({ headerTitle: 'Fish'});
	var fishDataSet = [
	    {properties: { title: 'Cod'}},
	    {properties: { title: 'Haddock'}},
	    {properties: { title: 'Salmon'}},
	    {properties: { title: 'Tuna'}},
	];
	fishSection.setItems(fishDataSet);
 
	listView.sections = sections;
 
	var refreshCount = 0;
 
	function getFormattedDate(){
	    var date = new Date();
	    return date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
	}
 
 
	function resetPullHeader(){
	    actInd.hide();
	    imageArrow.transform=Ti.UI.create2DMatrix();
	    if (refreshCount < 2) {
	        imageArrow.show();
	        labelStatus.text = 'Pull down to refresh...';
	        labelLastUpdated.text = 'Last Updated: ' + getFormattedDate();
	    } else {
	        labelStatus.text = 'Nothing To Refresh';
	        labelLastUpdated.text = 'Go Cook Something';
	        listView.removeEventListener('pull', pullListener);
	        listView.removeEventListener('pullend', pullendListener);
	        eventStatus.text = 'Removed event listeners.';
	    }
    	listView.setContentInsets({top:0}, {animated:true});
	}
 
	function loadTableData()
	{
	    if (refreshCount == 0) {
	        listView.appendSection(vegSection);
	    } else if (refreshCount == 1) {
	        listView.appendSection(fishSection);
	    } 
	    refreshCount ++;
	    resetPullHeader();
	}
 
	function pullListener(e){
	    eventStatus.text = 'EVENT pull FIRED. e.active = '+e.active;
	    if (e.active == false) {
	        var unrotate = Ti.UI.create2DMatrix();
	        imageArrow.animate({transform:unrotate, duration:180});
	        labelStatus.text = 'Pull down to refresh...';
	    } else {
	        var rotate = Ti.UI.create2DMatrix().rotate(180);
	        imageArrow.animate({transform:rotate, duration:180});
	        if (refreshCount == 0) {
	            labelStatus.text = 'Release to get Vegetables...';
	        } else {
	            labelStatus.text = 'Release to get Fish...';
	        }
	    }
	}
 
	function pullendListener(e){
	    eventStatus.text = 'EVENT pullend FIRED.';
	    if (refreshCount == 0) {
	        labelStatus.text = 'Loading Vegetables...';        
	    } else {
	        labelStatus.text = 'Loading Fish...';
	    }
	    imageArrow.hide();
	    actInd.show();
	    listView.setContentInsets({top:80}, {animated:true});
	    setTimeout(function(){
	        loadTableData();
	    }, 2000);
	}

	var tableHeader = Ti.UI.createView({
	    backgroundColor:'#e2e7ed',
	    width:320, height:80
	});
  
	var border = Ti.UI.createView({
	    backgroundColor:'#576c89',
	    bottom:0,
	    height:2
	});
	tableHeader.add(border);
  
	var imageArrow = Ti.UI.createImageView({
	    image:'images/whiteArrow.png',
	    left:20, bottom:10,
	    width:23, height:60
	});
	tableHeader.add(imageArrow);
  
	var labelStatus = Ti.UI.createLabel({
	    color:'#576c89',
	    font:{fontSize:13, fontWeight:'bold'},
	    text:'Pull down to refresh...',
	    textAlign:'center',
	    left:55, bottom:30,
	    width:200
	});
	tableHeader.add(labelStatus);
  
	var labelLastUpdated = Ti.UI.createLabel({
	    color:'#576c89',
	    font:{fontSize:12},
	    text:'Last Updated: ' + getFormattedDate(),
	    textAlign:'center',
	    left:55, bottom:15,
	    width:200
	});
	tableHeader.add(labelLastUpdated);
  
	var actInd = Ti.UI.createActivityIndicator({
	    left:20, bottom:13,
	    width:30, height:30
	});
	tableHeader.add(actInd);
 
 
	listView.pullView = tableHeader;
 
	listView.addEventListener('pull', pullListener);
 
	listView.addEventListener('pullend',pullendListener);
 
 
	var eventStatus = Ti.UI.createLabel({
	    font:{fontSize:13, fontWeight:'bold'},
	    text: 'Event data will show here',
	    bottom:0,
	    height:'10%'
	});
 
	win.add(listView);
	win.add(eventStatus);
}

function list_v2_ui_pull(_args) {
	var win = Ti.UI.createWindow({
		title:'Pull View',
		layout:'vertical'
	});
	
	var scrollView = Ti.UI.createScrollView({layout:'vertical'});
	
	var desc = Ti.UI.createLabel({
		text:'This test shows the pullView support in ListView. The pullView property replaces the headerPullView property in TableView.\n\n'+
		'In addition to the pullView property, the ListView also introducs two new events - pull and pullend.\n\n'+
		'The pull event is fired whenever the user drags the listView past the top edge of the pullView.\n\n'+
		'The pull event has a single custom argument active (boolean) which is true when the pullView is fully visible and false when it is partially visible\n\n'+
		'The pullend event fires when the user stops dragging the ListView and the pullView is completely visible.\n\n'
	});
	
	scrollView.add(desc);
	
	var button = Ti.UI.createButton({
		top:10,
		title:'I understand'
	});
	
	scrollView.add(button);
	
	button.addEventListener('click',function(){
		win.remove(scrollView);
		genTest(win);
	});
	
	win.add(scrollView);

	return win;
};

module.exports = list_v2_ui_pull;