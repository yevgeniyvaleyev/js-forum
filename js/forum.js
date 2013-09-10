var forum = {};

/**
 * Just an emulator of server responses
 * @param data
 */
function emulateServerResponse(data) {
    var date = new Date().valueOf();
    data.success({
        status: 'ok',
        author: data.params.author,
        message: data.params.message,
        header : 'some server generated header ' + date,
        id: date,
        date: date
    });
    data.complete();
}


/**
 * Basic View Model which contains basic
 * functionality
 */
forum.basicModel = {
    /*
     * Implements model data
     * @param data, object
     * @access public
     * @return null
     */
    implement : function (data) {
        for (var i in data) {
            this[i] = (i != 'date')
                ? data[i]
                : this.formatedDate(data[i],'MMM d, yyyy h:mm a');
        }
    },
    /*
     * Date formatter
     * @param date, date representation
     * @param pattern, string
     * @access public
     * @return string
     */
    formatedDate : function (date, pattern) {
        return $.format.date(date, pattern);
    },
    /*
     * Remote calls
     * @param _data, object
     * @access public
     * @return null
     */
    sync : function (data) {

        // dummy responses
        emulateServerResponse(data);
        return;


        var endpoint = "/"; // your end point url
        var defaultData = {
            url : '',
            params: {},
            success: function(){},
            error: function(){},
            complete: function(){}
        }
        $.extend(true, defaultData, data);
        $.post(endpoint + defaultData.url, defaultData.params)
            .success(defaultData.success)
            .error(defaultData.error)
            .complete(defaultData.complete);
    },
    /*
     * Handles errors
     * @param description, string
     * @param err, object
     * @access public
     * @return null
     */
    handleError : function (description, err) {
        console.warn(description, err);
    }
}

/*
 * Message View Model
 * @param data, object
 * @access public
 * @return null
 */
forum.messageViewModel = function (data) {
    // Model can be extended
    this.implement(data);
}
forum.messageViewModel.prototype = forum.basicModel;

/*
 * Thread View Model
 * @param data, object
 * @access public
 * @return null
 */
forum.threadViewModel = function (data) {
    var self = this;
    this.implement(data);
    this.messages = ko.observableArray();
    this.threadExpanded = ko.observable(false);
    this.messagesExpanded = ko.observable(false);
    this.currentTime = ko.observable();

    /*
     * Triggers messages area
     * @access public
     * @return null
     */
    this.expandMessages = function () {
        self.messagesExpanded(!self.messagesExpanded());
    }
    /*
     * Triggers thread area
     * @access public
     * @return null
     */
    this.expandThread = function () {
        self.threadExpanded(!self.threadExpanded());
        if (!self.threadExpanded()) {
            self.messagesExpanded(self.threadExpanded());
        }
    }
    /*
     * Updates a current time every minute
     * @access private
     * @return null
     */
    var setCurrentTime = function () {
        var time1 = self.formatedDate(new Date().getTime(),'MMM d');
        var time2 = self.formatedDate(new Date().getTime(),'h:mm a');
        self.currentTime(time1 + ' at ' + time2);
    }
    setInterval(setCurrentTime,1000); // TODO: avoid this
    /*
     * Posts a message to the thread
     * @param form, object
     * @access public
     * @return null
     */
    this.postMessage = function (form) {
        var params = {
            author: self.author,
            threadid: self.id,
            message: $('[name="message"]',form).val()
        };
        $('button',form).attr('disabled','disabled');
        self.sync({
            url: "/post/create",
            params: params,
            success: function (data) {
                if (typeof data != 'object') {
                    data = JSON.parse(data);
                }
                if (data.status == 'ok') {
                    self.messages.push(new forum.messageViewModel(data));
                    $('[name="message"]',form).val('');
                } else {
                    self.handleError('Post create:', data);
                }
            },
            error: function (err) {
                self.handleError('Post create:', err);
            },
            complete: function () {
                $('button',form).removeAttr('disabled');
            }
        })
    }
}
forum.threadViewModel.prototype = forum.basicModel;

/*
 * Application View Model
 * @access public
 * @return null
 */
forum.appViewModel = function () {
    var self = this;
    this.threads = ko.observableArray();

    /*
     * Creates a thread
     * @param form, object
     * @access public
     * @return null
     */
    this.postThread = function (form) {
        var params = {
            author: $('[name="author"]',form).val(),
            message: $('[name="message"]',form).val()
        };
        $('button',form).attr('disabled','disabled');
        self.sync({
            url: "/thread/create",
            params: params,
            success: function (data) {
                if (typeof data != 'object') {
                    data = JSON.parse(data);
                }
                if (data.status == 'ok') {
                    self.threads.unshift(new forum.threadViewModel(data));
                    $('[name="message"]',form).val('');
                    $('[name="author"]',form).val('');
                } else {
                    self.handleError('Thread create:', data);
                }
            },
            error: function (err) {
                self.handleError('Thread create:', err);
            },
            complete: function () {
                $('button',form).removeAttr('disabled');
            }
        })
    }
}
forum.appViewModel.prototype = forum.basicModel;

$(function () {
    ko.applyBindings(new forum.appViewModel, $("#simple-forum")[0]);
});


