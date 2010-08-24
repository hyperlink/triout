// my localStorage wrapper

const store = {
   set: function(k, v) {
      localStorage.setItem(k, JSON.stringify(v));
      return this;
   },
   
   get: function(k) {
      var v = localStorage.getItem(k);
      return v ? JSON.parse(v) : void 0;
   },
   
   remove: function(k) {
       localStorage.removeItem(k);
       return this;
   },
   
   clear: function() {
      localStorage.clear();
      return this;
   }
};