export default class EventEmitter {
  on(name, cb) {
    if (cb === undefined) debugger;
    if (name instanceof Array) {
      for (let n of name) {
        this.on(n, cb);
      }
      return;
    }
    this._events = this._events || {};
    this._events[name] = this._events[name] || [];
    this._events[name].push(cb);
    return this;
  }

  /**
   * off removes the callback cb registered to the event name. If no callback is
   * provided all callbacks registered to the event name are removed.
   *
   * TODO: off should require a callback be supplied.
   */
  off(name, cb = null) {
    if (name instanceof Array) {
      for (let n of name) {
        this.off(n, cb);
      }
      return;
    }
    this._events = this._events || {};
    this._events[name] = this._events[name] || [];
    if (cb && this._events[name] && this._events[name].length > 0) {
      this._events[name] = this._events[name].filter(eventCb => eventCb !== cb);
    } else if (this._events[name]) {
      delete this._events[name];
    }
    return this;
  }

  trigger(name, ...args) {
    if (this._events === undefined) return;
    let events = this._events[name];
    if (events !== undefined) {
      for (let i = 0; i < events.length; i++) {
        let cb = events[i],
          cont = cb.call(this, ...args);
        if (cont === false) break;
      }
    }
    return this;
  }

  /** emit aliases trigger to resemble the Node JS event emitter APIs.
   */
  emit(name, ...args) {
    this.trigger(name, ...args);
    return this;
  }

  /**
   * onArray listens via on to an array of emitters.
   */
  static onArray(array, name, clb) {
    array.forEach(emitter => emitter.on(name, clb));
  }
}
