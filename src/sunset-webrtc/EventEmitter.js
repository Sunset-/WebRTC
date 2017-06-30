function EventEmitter() {}
EventEmitter.prototype = {
    getEvents() {
        if (this.events) {
            return this.events;
        } else {
            return this.events = {};
        }
    },
    getBindEvents() {
        if (this.bindEvents) {
            return this.bindEvents;
        } else {
            return this.bindEvents = {};
        }
    },
    emit(eventName) {
        var cbs = this.getEvents()[eventName];
        if (cbs && cbs.length) {
            var args = [].slice.call(arguments, 1);
            cbs.forEach(cb => {
                cb.apply(this, args);
            })
        }
    },
    on(eventName, cb) {
        (this.getEvents()[eventName] || (this.getEvents()[eventName] = [])).push(cb);
    },
    trigger(eventName, id) {
        var cbs = this.getBindEvents()[id] && this.getBindEvents()[id][eventName];
        if (cbs && cbs.length) {
            var args = [].slice.call(arguments, 2);
            cbs.forEach(cb => {
                cb.apply(this, args);
            })
        }
    },
    bind(eventName, id, cb) {
        var events = this.getBindEvents()[id] = (this.getBindEvents()[id] || {});
        (events[eventName] || (events[eventName] = [])).push(cb);
    },
    unbind(id) {
        delete this.getBindEvents()[id];
    }
}

EventEmitter.prototype.constructor = EventEmitter;

module.exports = EventEmitter;