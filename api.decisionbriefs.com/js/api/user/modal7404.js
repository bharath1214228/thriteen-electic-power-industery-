var aicore = aicore || {};

/**
 * Modal preferences operations
 * @param options
 * @returns {aicore.modal}
 */
aicore.modal = function(options) {
    this.prefs = new aicore.prefs(options);
};

/**
 * mark a modal as shown to update the last shown date
 * @param key
 * @param callback
 */
aicore.modal.prototype.shownPeriod = function(key, callback) {
    this.prefs.set('modals.' + key, Math.round(+new Date()/1000), callback);
};

aicore.modal.prototype.toShowCounter = function(key, minValue, maxValue, callback) {
    this.prefs.increment('modals.' + key, function(curValue) {
        if (curValue) {
            var toShow = true;
            if (minValue && curValue < minValue) {
                toShow = false;
            }
            if (toShow && maxValue && curValue > maxValue) {
                toShow = false;
            }
            if (callback) {
                callback(toShow);
            }
        }
    });
};

/**
 * determine whether to show a modal
 * @param key
 * @param period possible options: 'day', 'week', '2 weeks', 'month', 'once'
 * @param callback
 */
aicore.modal.prototype.toShow = function(key, period, callback) {
    this.prefs.get('modals.' + key, function(response) {
        var result = false;
        if (response) {
            var lastShown = new Date(response * 1000);
            var difference = (Date.now() - lastShown.getTime()) / 1000;
            switch (period) {
                case 'once':
                    // it has already been shown once
                    result = false;
                    break;
                case 'day':
                    // has the modal been shown in last 24 hours?
                    result = difference > 3600 * 24;
                    break;
                case 'week':
                    // has a week passed since then?
                    result = difference > 3600 * 24 * 7;
                    break;
                case '2 weeks':
                    // what about two weeks?
                    result = difference > 3600 * 24 * 14;
                    break;
                case 'month':
                    lastShown.setMonth(lastShown.getMonth() + 1);
                    result = lastShown.getTime() < Date.now();
                    break;
            }
        } else {
            result = true;
        }

        callback(result);
    });
};