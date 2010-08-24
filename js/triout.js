
const triout = {

    lastSearchResult: {
        data: null,
        time: null
    },
    
    searchRadius: 1,

    _locationCache: {},

    lastCheckinResponse: null,

    _authorized: false,

    userId : null,

    _loginCallback: null,
    _renderCallback: null,

    isAuthorized: function() {
        return (this._authorized && (this.userId != null));
    },

    auth: {
        username: '',
        password: ''
    },
    apiUrl: "https://api.trioutnc.com/v1/?",
    webUrl: "http://trioutnc.com/",
    
    /**
    add Location using the last position ID
     */
    addLocation: function(data, callback) {
       var ajaxConf = {
            url: this.apiUrl + "add",
            beforeSend: this._basicAuthentication,
            type: "POST",
            success: callback,
            data: jQuery.extend({
                lat: this.lastLocation.coords.latitude,
                long: this.lastLocation.coords.longitude
            }, data)
        };
        console.log("ajaxConf", ajaxConf);
        // $.ajax(ajaxConf);
    },

    getLocationDetail:  function(id, cb) {
        if (this._locationCache[id] != null) {
            console.log('found id '+ id +' in cache');
            cb(this._locationCache[id]);
            return;
        }
        this.requestLocationDetail(id, cb);
    },

    logout: function() {
        console.log("logout called");
        this.setUser('', '');
        this._authorized = false;
        store.remove('auth');
    },

    requestLocationDetail: function(id, cb) {
        var query = {q: id, output: 'json'},
        that = this,
        url = this.apiUrl +'search&'+ jQuery.param(query);
        console.log("request: "+ url);

        jQuery.getJSON(url, function(data) {
            if (data.length > 0) {
                that._locationCache[id] = data[0];
                cb(data[0]);
            } else {
                cb(null);
            }
        });
    },

    requestClosest: function(lat, long) {	
        var query = {
            lat: lat,
            long: long,
            m: this.searchRadius,
            output: 'json'	
        },
        url = this.apiUrl + "locations&" + jQuery.param(query);

        console.log("requesting: "+ url);
        jQuery.getJSON(url, jQuery.proxy(function(data) {
            console.log("returned data", data);
            triout.lastSearchResult.data = data;
            triout.lastSearchResult.time = new Date();
            this._renderCallback(data);
            }, this));
        },

        setUser: function(username, password) {
            this.auth.username = username;
            this.auth.password = password;
            this._authorized = false;
        },

        checkin: function(cfg, handler) {
            console.log("cfg", cfg);
            var ajaxConf = {
                url: this.apiUrl + "checkin",
                beforeSend: this._basicAuthentication,
                type: "POST",
                success: handler,
                data: cfg
            };
            console.log("ajaxConf", ajaxConf);
            jQuery.ajax(ajaxConf);
        },

        _basicAuthentication: function(xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(triout.auth.username + ":" + triout.auth.password));
            console.log(triout.auth.username, triout.auth.password);
        },

        _loginHandler: function(data) {
            var userId = parseInt(data);
            if (!isNaN(userId)) {
                this.userId = userId;
                this._authorized = true;
                store.set('auth', this.auth);
                console.log("_loginHandler", this._loginCallback);
                if ( this._loginCallback ) {
                    this._loginCallback({success: true, userId: userId});
                }
            } else {
                this._authorized = false;
                console.log(this._loginCallback);
                if ( this._loginCallback ) {
                    this._loginCallback({success: false, message: data});
                }
            }
        },

        login: function(cb) {
            if (cb != null)
            this._loginCallback = cb;
            console.log("callback", this._loginCallback);
            var confg = {
                beforeSend: this._basicAuthentication,
                url: this.apiUrl + "login",
                type: "POST",
                success: jQuery.proxy(this._loginHandler, this)
            };
            console.log(confg)
            jQuery.ajax(confg);
        },

        tryLogin: function(cb) {
            if (this.auth.username && this.auth.password) {
                this.login(cb);
            } else {
               cb({success: false, message: 'Not logged in.'});
            }
        },

        getUserLocation: function(cb) {
            this._renderCallback = cb;
            navigator.geolocation.getCurrentPosition( function(p) {
                triout.lastLocation = p;
                triout.requestClosest(p.coords.latitude, p.coords.longitude);  
            });
        }
    };

// Initializations
(function(){
   var auth = store.get("auth");
   if (auth != null) {
      triout.setUser(auth.username, auth.password);
   }
})();
