//
// setup
//
window.onload = function()
{

	//
	// Helper function to add a class to the body
	// 
	Titanium.UI.addBodyClass = function(c)
	{
		var classes = document.body.className;
		document.body.className = classes + ' ' + c;
	};


	//
	// setup system property background image
	//
	Titanium.UI.setPropertyBackground = function()
	{
		Titanium.UI.addBodyClass('property_background');
	};

	//
	// create a progress bar
	//
	Titanium.UI.createProgressBar = function(id)
	{
		var el = document.getElementById(id);
		if (!el)
		{
			alert('createProgressBar: invalid element id ' + id);
			return;
		}

		el.className += ' progress_bar';
		var html = '<div id="progress_'+id+'" class="value" ></div>';
		el.innerHTML = html;
	};

	//
	// update progress bar
	//
	Titanium.UI.updateProgressBar = function(id,value)
	{
		var el = document.getElementById('progress_'+id);
		if (!el)
		{
			alert('updateProgressBar: invalid element id ' + id);
			return;
		}

		el.style.width = String(value) +"px";
	};


	//
	// Create a on/off switch
	//
	Titanium.UI.createSwitch = function(id, value, callback)
	{
		var el = document.getElementById(id);
		if (!el)
		{
			alert('createSwitch: invalid element id ' + id);
			return;
		}

		// create control
		el.className += " switch_container ";
		var html = '<div id="switch_'+id+'" class="switch"><div class="switch_on"></div><div class="switch_off"></div></div>';
		el.innerHTML = html;

		// set initial value
		var right = (value ==true)?'0px':'94px';
		document.getElementById("switch_" + id).style.right = right;

		// setup touch listener
		el.addEventListener('touchend',function()
		{
		   	var c = document.getElementById("switch_" + id);
			if (c.style.right == '0px')
			{
				c.style.right = '94px';
				c.setAttribute('switch','off');
				if (callback) callback(false);
			}
			else
			{
				c.style.right = '0px';
				c.setAttribute('switch','on');
				if (callback)callback(true);
			}
		},false);
	};

	//
	// create text element
	//
	Titanium.UI.createTextElement = function(id,bold)
	{
		var el = document.getElementById(id);
		if (!el)
		{
			alert('createTextElement: invalid element id ' + id);
			return;
		}
		el.className += 'label ';
		if (bold)
		{
			el.className+='bold';
		}
	};
	
	//
	// Define iPhone specific UI controls
	//
	if (Titanium.Platform.name.indexOf('iPhone') != -1)
	{
	    Titanium.UI.iPhoneNotificationCount = 0;
		
		//
		// Titanium Notification for iPhone
		//
		Titanium.UI.Notification = function(options)
		{			
		
			// get latest html for notification
			this.getHTML = function()
			{
				if (Titanium.Platform.version == '3.0')
				{
					return '<div style="height:0px;color:'+this.color+';background:-webkit-gradient(linear, left top, left bottom, from(#555), to(#111));padding:5px">' + this.message + '</div>';
				}
				return '<div style="height:0px;color:'+this.color+';background-color:#444;padding:5px">' + this.message + '</div>';
				
			}
			// show notification
			this.show = function()
			{
				var self = this;
				this.visible = true;
				
				// sroll to top
				window.scrollTo(0,0)			
				
				// create element if not exists
				if (document.getElementById('titanium_iphone_notification_' + this.id) == null)
				{
					// set html - have to do appendChild, setting innerHTML jacks up the innerHTML
					var d = document.createElement('div');
					d.id = "titanium_iphone_notification_"+this.id;
					d.className = 'notification';
					d.innerHTML = this.getHTML();
					document.body.appendChild(d);
				}
				// otherwise update html
				else
				{
					document.getElementById('titanium_iphone_notification_' + this.id).innerHTML = this.getHTML();
				}

				// setup listeners
				var el = document.getElementById('titanium_iphone_notification_' + this.id);
				
				// close on touch
				el.ontouchstart = function()
				{
					self.visible = false;
					var el = document.getElementById('titanium_iphone_notification_'+ self.id);
					el.getElementsByTagName('DIV')[0].style.height = "0px";
					setTimeout(function(){el.innerHTML = ''},250);
					return false;
										
				};
				
				// close on scroll
				document.body.ontouchmove = function(e)
				{
					if (self.visible == true)
					{
						e.preventDefault();
					}
				}

				// setup autohide
				if (this.autohide == true)
				{
					setTimeout(function()
					{
						self.visible = false;
						var el = document.getElementById('titanium_iphone_notification_'+ self.id);
						el.getElementsByTagName('DIV')[0].style.height = "0px";
						setTimeout(function(){el.innerHTML = ''},250);
					},3000)
				}

				// show notification
				document.getElementById('titanium_iphone_notification_' + this.id).style.display = "block";
				document.getElementById('titanium_iphone_notification_' + this.id).getElementsByTagName('DIV')[0].style.height = this.height;
			};
			
			// set notification message
			this.setMessage = function(msg)
			{
				this.message = msg;
			};

			// initialization
			this.id = Titanium.UI.iPhoneNotificationCount++;
			this.autohide = true;
			this.visible = false;
			this.height = '60px';
			
			if (options)
			{
				// message
				if (options.message) this.message = options.message;
				
				this.backgroundColor('#333333');
				this.color('#ffffff');
			};

		};
		
		Titanium.UI.createNotification = function(options)
		{
			return new Titanium.UI.Notification(options);
		};
		
	}

	//
	// Create a Grouped View
	// id: the ID of the element
	// type: the type of grouped list.  there are 3 supported types:
	//		1. option - show a list of selectable options (1 active at a time)
	//		2. input - show a list of editable values. sub-types are: (switch, input, select, readonly)
	//      3. button - show a list of buttons (simply clickable)
	Titanium.UI.createGroupedView = function(id,type,data,callback)
	{
		var list = document.getElementById(id);

		if (!list)
		{
			alert('createGroupedView: invalid element id ' + id);
			return;
		}
		if (type != 'option' && type != 'input' && type != 'button')
		{
			alert('createGroupedView: invalid type ' + type);
			return;
		}

		//
		// row delegates for each supported type.  row delegates create structure for each type
		//
		function optionRowDelegate(data)
		{
			var image = '';
			var textPos = '';
			if (data.image)
			{
				image = '<img height="32px" width="32px" style="position:relative;top:6px;margin-right:10px" src="'+data.image+'"/>'
				textPos = 'style="position:relative;top:-4px"';
			}
			if (data.selected == true)
			{
				return '<span class="active"> '+ image + ' <span ' + textPos + ' >' + data.title + '</span></span><div class="option_selected" style="display:block"></div>';
			}
			return '<span> '+ image + ' <span ' + textPos + ' >' + data.title + '</span><div class="option_selected" style="display:none"></div>';
		};
		function buttonRowDelegate(data)
		{
			var image = '';
			var textPos = '';
			if (data.image)
			{
				image = '<img height="32px" width="32px" style="position:relative;top:6px;margin-right:10px" src="'+data.image+'"/>'
				textPos = 'style="position:relative;top:-4px"';

			}

			return '<div class="button"> '+ image + ' <span ' + textPos + ' >' + data.title + '</span></div>';		
		};
		function inputRowDelegate(data)
		{
			var image = '';
			var textPos = ''
			if (data.image)
			{
				image = '<img height="32px" width="32px" style="position:relative;top:6px;margin-right:10px" src="'+data.image+'"/>'
				textPos = 'style="position:relative;top:-4px"';
			}
			switch (data.type)
			{
				case 'input':
				{
					return '<span> '+ image + ' <span ' + textPos + ' >' + data.title + '</span></span><span class="'+data.type+'"><input id="'+data.id+'" type="text" value="'+data.value+'" /></span>';
				}
				case 'select':
				{
					return '<span> '+ image + ' <span ' + textPos + ' >' + data.title + '</span><span class="'+data.type+'"><span id="'+data.id+'" style="position:relative;left:-15px">'+data.value+'</span></span>';
				}
				case 'switch':
				{
					return '<div style="float:left"> '+ image + ' <span ' + textPos + ' > '+data.title+'</span></div><div  id="'+data.id+'" value="'+data.value+'" style="float:right;position:relative;top:7px;right:10px"></div>';
				}
				case 'readonly':
				{
					return '<span> '+ image + ' <span ' + textPos + ' >' + data.title + '</span></span><span class="'+data.type+'"><span id="'+data.id+'">'+data.value+'</span></span>';
				}
			}
		};

		//
		// event delegates for each support type.  event delegates add input listeners and wire up any other required events
		//
		function optionEventDelegate(e,data, callback)
		{
			var classes = e.className;
			var touchReset = false;
			e.addEventListener('touchstart',function()
			{
				touchReset = false;
				var self = this;
				setTimeout(function()
				{
					if (touchReset == false)
					{
						// row selection classes
						self.className = classes + ' row_click';

						// add text effect
						self.getElementsByTagName('SPAN')[0].className = 'option_press_text';

						// add check effect if we are already active
						var selected = self.getElementsByClassName('option_selected');
						if (selected[0].style.display == 'block')
						{		
							selected[0].className = 'option_press_check';
						}

					}
				},100);

			},false);
			e.addEventListener('touchmove',function()
			{	
				touchReset = true;
			});

			e.addEventListener('touchend',function()
			{	
				var self = this;

				setTimeout(function()
				{
					if (self.className.indexOf('row_click') != -1)
					{
						// remove selection class
						self.className = classes;

						// turn everything off
						var list = document.getElementById('group_list_' + id);
						var selectedIcons = list.getElementsByClassName('option_selected');
						for (var i=0;i<selectedIcons.length;i++)
						{
							selectedIcons[i].style.display = 'none';
						}
						var rows = list.getElementsByClassName('row');
						for (var i=0;i<rows.length;i++)
						{
							rows[i].setAttribute('selected','false');
							rows[i].getElementsByTagName('SPAN')[0].className = '';
						}

						// show check mark
						var x =  self.getElementsByClassName('option_press_check');
						if (x.length ==1) {x[0].className = 'option_selected';}
						var active = self.getElementsByClassName('option_selected');
						active[0].style.display = 'block';

						// add selected attribute
						self.setAttribute('selected','true');

						// add active text class
						self.getElementsByTagName('SPAN')[0].className = 'active';

						// execute row callback
						if (callback) callback(parseInt(self.getAttribute('row')));

					}				

				},100)

			},false);

		};
		function buttonEventDelegate(e,data,callback)
		{
			var classes = e.className;
			var touchReset = false;
			e.addEventListener('touchstart',function()
			{
				touchReset = false;
				var self = this; 
				setTimeout(function()
				{
					if (touchReset == false)
					{
						self.className = classes + ' row_click';
					}
				},100)
			},false);

			e.addEventListener('touchmove',function()
			{
				touchReset = true;
			});

			e.addEventListener('touchend',function()
			{		
				var self = this;
				setTimeout(function()
				{
					if (self.className.indexOf('row_click') != -1)
					{
						self.className = classes;
						if (callback) callback(parseInt(self.getAttribute('row')));
					}				
				},100);
			},false);
		};
		function inputEventDelegate(e,data,callback)
		{
			var el = document.getElementById(data.id);
			if (!el)return;

			switch(data.type)
			{
				case 'input':
				{
					el.onblur = function()
					{
						if (callback) callback({id:data.id,value:el.value});
					};
					break;
				}
				case 'switch':
				{
					Titanium.UI.createSwitch(data.id,data.value,function(value)
					{
						if (callback) callback({id:data.id,value:value})
					});
					break;
				}
				case 'select':
				{
					el.onclick = function()
					{
						if (callback) callback({id:data.id, value:parseInt(el.getAttribute('row'))});
					};

					break;
				}
			}
		};

		// map delegate functions
		var rowDelegate = (type=='option')?optionRowDelegate:(type=='input')?inputRowDelegate:buttonRowDelegate;
		var eventDelegate = (type=='option')?optionEventDelegate:(type=='input')?inputEventDelegate:buttonEventDelegate;

		// create basic row template
		var html = '<div id="group_list_'+id+'" class="grouped_view">';
		for (var i=0;i<data.length;i++)
		{
			var classes = 'row ';
			// if row 1
			if (i==0)
			{
				classes += ' top';
			}
			// if last row
			else if (i==(data.length -1))
			{
				classes += ' bottom';
			}
			// if only one row
			if (i==(data.length -1) && i==0)
			{
				classes = 'row single_row';
			}
			html += '<div row="' + i + '"  class="'+classes+'">';

			// now delegate to 'type' handler
			html += rowDelegate(data[i]);
			html += '</div>';
		}
		html += '</div>';
		list.innerHTML = html;

		// now call event delegates
		var rows = list.getElementsByClassName('row');
		for (var i=0;i<rows.length;i++)
		{
			eventDelegate(rows[i],data[i],callback);
		}

	};

	// 
	// Create Table View
	//
	Titanium.UI.createTableView = function(id, data, callback)
	{
		var list = document.getElementById(id);
		if (!list)
		{
			alert('createTableView: invalid element id ' + id);
			return;
		}
		if (data)
		{
			var html = '';
			var count = (data.length < 9)?9:data.length;
			for (var i=0;i<count;i++)
			{
				html += "<div row='"+i+"' class='table_view'>";

				if (i < data.length)
				{
					var image = data[i].image;
					var text = data[i].title;
					var hasChild = data[i].hasChild;
					var hasDetail = data[i].hasDetail;
					var detailClass = (hasChild==true)?'arrow':(hasDetail==true)?'detail':'';
					var textPos = '';

					if (image)
					{
						textPos = 'style="position:relative;top:-2px"';
						html += '<img height="32px" width="32px" style="position:relative;top:6px;margin-right:10px" src="'+image+'"/>';
					}
					html += '<span ' + textPos + ' >' + text + '</span>';
					html += '<div id="detail_' + id + '_' + i + '" class="'+detailClass+'" style="display:block"></div>';
				}
				html+= '</div>';

			}
		}
		list.innerHTML =  html;
		list.className += 'table_view_container';
		
		var rows = list.getElementsByClassName('table_view');
		for (var i=0;i<rows.length;i++)
		{	
			if (data.length > i)
			{
				rows[i].addEventListener('touchstart',function()
				{
					this.setAttribute('reset','false');
					var self = this;
					setTimeout(function()
					{
						var reset = self.getAttribute('reset');
						if (reset == 'false')
						{
							var els = list.getElementsByClassName('table_view');
							for (var i=0;i<els.length;i++)
							{
								els[i].className = els[i].className.replace('row_click','');
								els[i].className = els[i].className.replace('highlight','');
							}
							var detail = self.getElementsByClassName('detail');
							if (detail.length !=0)
							{
								self.className += ' row_click';
							}
							else
							{
								self.className += ' row_click highlight';
							}
							var arrow = self.getElementsByClassName('arrow');
							if (arrow.length == 1)
							{
								arrow[0].className = 'arrow_touch';
							}
						}
					},140);
				},false);

				rows[i].addEventListener('touchmove',function(e)
				{
					if (this.className.indexOf('row_click')==-1)
					{
						this.setAttribute('reset','true');
					}
				},false);

				rows[i].addEventListener('touchend',function()
				{
					var self = this;
					setTimeout(function()
					{
						var reset = self.getAttribute('reset');
						if (self.className.indexOf('row_click') != -1 && reset == 'false')
						{
							if (callback) callback(parseInt(self.getAttribute('row')));
						}
						self.className = self.className.replace('row_click','');
						self.className = self.className.replace('highlight','');
						
						var arrow = self.getElementsByClassName('arrow_touch');
						if (arrow.length == 1)
						{
							arrow[0].className = 'arrow';
						}	

					},140);
				},false);

			}
		}

	};

	// add platform class to body
	Titanium.UI.addBodyClass(Titanium.Platform.name);

	// call ready
	Titanium.UI.ready();

};


