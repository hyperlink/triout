var SETTINGS  = chrome.extension.getBackgroundPage().SETTINGS,
	allBuilds = chrome.extension.getBackgroundPage().buildRegistry.get(),
	buildIds  = chrome.extension.getBackgroundPage().buildIds,
	SELECTED_ICON = "ui-icon-star",
	UNSELECTED_ICON = "ui-icon-minus";
	

// Saves options to localStorage.
function save_options() {
	$("input").each(function(){
		var name = $(this).attr("name");
		if (this.type === "checkbox")
			SETTINGS[name] = this.checked;
		else
			SETTINGS[name] = this.value;
	});
	
	var picks = getBuildPicks();	
	if (picks != null) {
		SETTINGS.builds = picks;
		updateBuildIcons();
	}	
	localStorage.settings = JSON.stringify(SETTINGS);	
	$("#status").fadeIn().fadeOut(4000);
}

function getBuildPicks() {
	var sel = $("#builds .ui-selected"), picks=[];
	if (sel.length > 0) {
		sel.each(function(){
			picks.push(allBuilds[$(this).text()]);
		});
		// console.log(picks);
		return picks;
	}
}

// update the status icons in build picks
function updateBuildIcons() {
	$("#builds li.ui-selectee").each(function(){
		var $icon = $("span.ui-icon", this);
		if ( $(this).is(".ui-selected") ) {
			$icon.removeClass(UNSELECTED_ICON).addClass(SELECTED_ICON);			
		} else {
			$icon.removeClass(SELECTED_ICON).addClass(UNSELECTED_ICON);	
		}
	});
}

// Restores select box state to saved value from localStorage.
function restore_options() {
	$("input").each(function(){
		if (this.type === "checkbox")
			this.checked = SETTINGS[this.name];
		else
			this.value = SETTINGS[this.name];
	});
}

function henrysPicks() {
	$("#builds li.ui-selectee").each(function(){
		$this = $(this);
		var buildName = $this.text();
		$this.removeClass("ui-selected");
		if ($.inArray(allBuilds[buildName], buildIds) > -1) {
			$this.addClass("ui-selected");
		}
	});
	return false;
}

function notificationRequestHandler() {
	console.log("permission is: "+ webkitNotifications.checkPermission());
	if (webkitNotifications.checkPermission()) {
		$("#enableNotification")[0].checked = false;
	}
}

$(function() {
	restore_options();
	
	$("button, input:submit, input:checkbox").button();
	var desktopNotification = $("#enableNotification");
	if (typeof webkitNotifications === "undefined")
		desktopNotification.button( "option", "disabled", true );
	
	desktopNotification.click(function(){
		if (webkitNotifications.checkPermission()) {
			webkitNotifications.requestPermission(notificationRequestHandler); // Request Permission with a callback to myNotification();
		}
	});
	
	var $builds = $("#builds");
	var li="";
	$.each(allBuilds, function(k,v){
		li += '<li class="ui-corner-all"><span style="float: left; margin-right: 0.3em;" class="ui-icon '+ (($.inArray(v, SETTINGS.builds) > -1) ? SELECTED_ICON : UNSELECTED_ICON) +'"></span>'+ k +"</li>";
	});
	$("ul", $builds).append(li).selectable();
	$("#HenrysPicks").click(henrysPicks);
	$("#buildConfig").accordion({collapsible: true, active: false, "fillSpace": true, "clearStyle": true});
	
	/*
	$.get("changeLog.txt", function(data){
		var $dialog = $('<div></div>')
		.html('<pre>'+data+'</pre>')
		.dialog({
			autoOpen: false,
			width: 600,
			title: 'Release Notes'
		});
		
		$('#releaseNotes').click(function() {
			$dialog.dialog('open');
			return false;
		});
	});	
	*/
});

if ( window.addEventListener ) {
	var kkeys = [], konami = "38,38,40,40,37,39,37,39,66,65";
	window.addEventListener("keydown", function(e){
		kkeys.push( e.keyCode );
		if ( kkeys.toString().indexOf( konami ) >= 0 ) {
			kkeys = [];
			window.location = chrome.extension.getURL("drwho.html");
		}
	}, true);
}