const debug = true;

const loadedFromBg = ['triout', 'popup'],
message = {
   noLocation : 'No TriOut locations found near you'
},
EVENT = {
   locationSelected : '/location/selected',
   locationUnselected: 'location/unselected',
   locationCheckedin: 'location/checkedin',
   loggedOut: 'triout/loggedOut',
   loggedIn: 'triout/loggedIn',
   cacheLoaded: 'app/cacheLoaded'
},
    LOCATION_IMG_TPL = '<a href="http://trioutnc.com/${ID}"><img src="http://tri-out.com/img/locations/${location_photo}-m.jpg" /></a>',
    LOCATION_NO_IMG_TPL = '<a href="http://trioutnc.com/${ID}" class="triout" title="Open location in a new tab">Show Location</a>';

if (debug) {
   debugEvents(EVENT);
}

utils.backgroundToWindow(loadedFromBg);

function debugEvents(e) {
   $.each(e, function(k, v){
      $.subscribe(v, function(){
         console.log('Event Pub "'+ v + '"', arguments);
      });
   });
}


function renderLocations(data) {
   // var data = testData;
   if ( ! Array.isArray(data) ) {
      console.error("data is not an array", data);
      return;
   }

   if (data.length == 0) {
      showNoLocation();
   } else {
      for(var i=0, len=data.length; i<len; ++i) {
         data[i]['distance']  = Math.round(data[i]['distance']*10)/10;
         data[i]['location_name'] =  filterName(data[i]['location_name'] );
      }
      $("#locations").html( $("#locationHeaderTpl").tmpl(data) );
      statusHeading.setStatus("Found "+ data.length +" locations near you");
   }
   $.unblockUI();
}

function showNoLocation() {
   $noLocation = $("#noLocation").fadeIn();
   statusHeading.setStatus(message.noLocation);
}

function showMapHandler() {
   var c = triout.lastLocation.coords, url = "http://maps.google.com/maps?q="+ [c.latitude, c.longitude].join(",");
   chrome.tabs.create({
      url : url
   });
   return false;
}

function filterName(str) {
   return str.replace("\\'", "'").replace("+", "&");
}

var selectedLocation = popup.lastSelectedLocation;

function locationClickHandler(e){
   console.log(e.target);
   $target = $(e.target);

   if ( $target.hasClass('selected') ) {
       selectedLocation = popup.lastSelectedLocation = null;
       $("#locations").removeClass('hidden');
       $target.removeClass('selected');
       $.publish(EVENT.locationUnselected, [e.target]);
   } else {
       selectedLocation = popup.lastSelectedLocation = $target.addClass('selected').attr("ref");
       $("#locations").addClass('hidden');
       console.log(selectedLocation);
       $.publish(EVENT.locationSelected, [e.target]);
   }
}
 
 $("#locations a").live("click", locationClickHandler);
 
// make links go to a new tab
 $("a[href!=#]").live('click', function(e){
     chrome.tabs.create({
        url : this.href
     });
     console.log(this.href);
     return false;
 });

 function getTextFromElement(jq, elementName) {
    return jq.find(elementName).text();
 }

 function parseXMLResult(data) {
    var $result = $(data),
    ret = { message: getTextFromElement($result, "message") };
    
    var $award = $result.find("award");
    if ( $award.length > 0 ) {
       ret['awardTitle'] = getTextFromElement($award, "awardTitle");
       ret['awardHeading'] = getTextFromElement($award, "awardHeading");
       ret['awardImage'] = getTextFromElement($award, "awardImage");
    }
    return ret;
 }
 
 function postCheckinHandler(result) {
    console.log("postCheckinHandler called", result);
    var parsedResult = parseXMLResult(result);
    console.log("parsed", parsedResult);
    statusHeading.setStatus(parsedResult.message);
    if (parsedResult.awardTitle)
      $('#checkinResultTpl').tmpl(parsedResult).appendTo("#checkinResult");
    $.publish(EVENT.locationCheckedin, [parsedResult]);
    popup.lastCheckin = parsedResult;
 }
 
 function checkin() {
    var checkinCfg = {
       loc: selectedLocation
    },
    message = $("#message").val();
    if (message) checkinCfg['message'] = message;	   
    $.extend(checkinCfg, getPostOptions());
    triout.checkin(checkinCfg, postCheckinHandler);
 }
 
 function getPostOptions() {
    var out = {};
    $("input:checkbox").each(function(){
       out[this.name] = this.checked ? this.value : 0;
    });
    return out;
 }
 
 $.blockUI.defaults = {
    message: '<h1><img src="/images/triout_logo.png" /> Locating</h1>',
    css: { 
       border: 'none', 
       padding: '15px', 
       backgroundColor: '#000', 
       '-webkit-border-radius': '10px',
       opacity: .5,
       margin: '20px 10px',
       color: '#fff' 
    }};
 
statusHeading = function(){
    // Assign status events
    $.subscribe(EVENT.locationSelected, hideStatus);
    $.subscribe(EVENT.locationUnselected, showStatus);

    function setStatus(str) {
        $("#status").find("span").text(str).end().fadeIn();
    }

    function hideStatus() {
        $("#status").hide();
    }

    function showStatus() {
        $("#status").fadeIn();
    }
    return {
        setStatus: setStatus,
        hideStatus: hideStatus,
        showStatus: showStatus
    };
}();

 $(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);

 $("#noLocation a").live('click', showMapHandler);
 
 $.subscribe(EVENT.locationCheckedin, function() {
     $("#locations, #locationDetails, #actions").hide();
 });
 
$.subscribe(EVENT.loggedOut, function(){
    $('#login').show();
    $('#loginStatus, #actions, .loggedIn').hide();
});
 
 $.subscribe(EVENT.locationSelected, function(){
     loadLocationDetails();
     if ( triout.isAuthorized() ) { 
         $("#actions").fadeIn(); 
     }
     $('#getLocation').hide();
 });
 
$.subscribe(EVENT.locationUnselected,  function(){  $("#locationDetails, #actions").hide();  $('#getLocation').show(); });
$.subscribe(EVENT.loggedIn, function(){
   if( selectedLocation ) $("#actions").show();
   $('.loggedIn').hide();
});
 
 
 function loadLocationDetails() {
     if (selectedLocation) {
         triout.getLocationDetail(selectedLocation, function(d){
             console.log(d, d.location_photo);
             $('#locationDetails').html($.tmpl(d.location_photo=='' ? LOCATION_NO_IMG_TPL : LOCATION_IMG_TPL, d)).show();
         });
     }
 }
 
 $('.controls').live('mousedown mouseup mouseout', function(e){
     if (e.type === 'mousedown') {
         $(this).addClass('active');
     } else {
         $(this).removeClass('active');
     }
   
 });
 
 $("#loginStatus a").live('click', function(){
     triout.logout();
     $.publish(EVENT.loggedOut);
     return false;
 });
 
 $('#getLocation').live('click', function(){
    initialize();
    return false; 
 });
 
 function loggedInHandler(data) {
    if (data.success) {
        $('#username,#password').val('');
        $('#login').hide();
        $('#loginStatus').show().find('span').text(triout.auth.username);
        $.publish(EVENT.loggedIn);
    } else {
        $('#login h2 span').text(data.message).fadeIn().fadeOut(5000);
        $.publish(EVENT.loggedOut);
    }
 }
 


$('#login button').live('click', function(){
   var $username = $('#username'),
       $password = $('#password');

   if ($username.val() && $password.val()) {
       triout.setUser($username.val(), $password.val());
       triout.login(loggedInHandler);
   }
   return false;
});

var $body = $('body');
 
$(window).unload(function() {
    popup.cache = $body.html();
    popup.unloaded = new Date();
});

// Action Behaviors
$("#checkin").live('click', checkin);
$("#message").live('focus', function() {
   $(this).attr("rows", 3).prev().find("img").attr("src", "http://tri-out.com/img/users/"+ triout.userId +"-t.jpg").show();
   }).live('blur', function(){
   var $this = $(this);
   if ($this.val() === "") {
      $this.attr("rows", 1).prev().find("img").hide();
   }
});
 
function initialize() {
    $.blockUI();
//  renderLocations();
    triout.getUserLocation(renderLocations);
}

// log user in if possible
if ( triout.isAuthorized() ) {
   loggedInHandler({success:true});
} else {
   console.log('is not logged in');
   triout.tryLogin(loggedInHandler);
}
 
if ('cache' in popup) {
    $body.html(popup.cache);
    $.publish(EVENT.cacheLoaded);
} else {
    initialize();
}

