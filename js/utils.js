const utils = {
	
	inArray: function(term, array) {
		return ($.inArray(term, array) > -1);
	},
	
	backgroundToWindow: function(arr) {
		var bg = chrome.extension.getBackgroundPage();
		for (var i=0, len=arr.length; i<len; ++i) {
			if (bg[arr[i]] == null )
				console.error(arr[i] + " is not in background!");
			else
				window[arr[i]] = bg[arr[i]];
		}
	},
   
   log: function() {
      if (debug) {
         console.log(arguments);
      }
   }
};