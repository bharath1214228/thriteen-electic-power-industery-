var aicore = aicore || {};

aicore.prefs = function(options) {
    var defaults = {
        'proxy_url_set': '/aicore-prefs-set/',
        'proxy_url_get': '/aicore-prefs-get/'
    };
    this.options = jQuery.extend(defaults, options);
};

aicore.prefs.prototype.getOption = function(key) {
    return this.options[key] || null;
};

aicore.prefs.prototype.set = function(key, value, callback) {
    var params = { };
    params[key] = value;
    var url = this.getOption('proxy_url_set');
    this.performQuery(function(){
        jQuery.post(url, params, function(response) {
            aicore_prefs_active = false;
            if (callback) {
                callback(response.result ? true : false);
            }
        }, 'json');
    });
};

aicore.prefs.prototype.increment = function(key, callback) {
    var params = {
        increment: key
    };
    var url = this.getOption('proxy_url_set');
    this.performQuery(function(){
        jQuery.post(url, params, function(response) {
            aicore_prefs_active = false;
            if (callback) {
                callback(response.result ? response.value : false);
            }
        }, 'json');
    });
};

aicore.prefs.prototype.get = function(key, callback) {
    var url = this.getOption('proxy_url_get');
    this.performQuery(function(){
        jQuery.getJSON(url, { parameter: key }, function(response) {
            aicore_prefs_active = false;
            if (callback) {
                callback(response ? response.result : null);
            }
        });
    });
};

/**
 * flag to determine whether an ajax query is active to avoid simultaneous running
 */
var aicore_prefs_active = aicore_prefs_active || false;

/**
 * due to cookies issues ajax queries can't be runned simultaneously
 * this function ensures they form a queue
 * @param query function
 */
aicore.prefs.prototype.performQuery = function(query) {
    if (aicore_prefs_active) {
        var that = this;
        setTimeout(function(){
            that.performQuery(query);
        }, 1000);
    } else {
        aicore_prefs_active = true;
        query();
    }
}