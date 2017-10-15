const DEBUG = true;

log = console.log.bind(console);

if (DEBUG)
    debug = console.info.bind(console);
else
    debug = () => undefined;

_props = obj => {
    return Object.getOwnPropertyNames(obj);
};

_items = obj => {
    const props = _props(obj);
    return props.map(k => [k, obj[k]]);
};

_has = (obj, prop) => {
    return Object.prototype.hasOwnProperty.call(obj, prop);
};

promisify = (method, context) => {
    return (...args) => {
        return new Promise(resolve => {
            method.call(context, ...args, (...args) => {
                resolve(...args);
            });
        });
    };
};

class PortMessenger {
    constructor(port) {
        this.hasListener = false;
        this.port = port;
        this.callbacks = new Map();
        if (_has(port, 'sender')) {
            this.frameId = port.sender.frameId;
            this.tabId = port.sender.tab.id;
            this.windowId = port.sender.tab.windowId;
            this.tab = port.sender.tab;
            this.url = port.sender.url;
        }
    }

    updatePort() {
        if (_has(this.port, 'sender')) {
            return C.tabs.get(this.tabId).then(tab => {
                this.windowId = tab.windowId;
                this.tab = tab;
            });
        }
        return Promise.resolve();
    }

    onMessage(callback) {
        if (this.hasListener)
            throw Error('PortMessenger already has a listener');
        this.hasListener = true;
        let listener = message => {
            this.updatePort().then(() => {
                this.handleOnMessage(message, callback);
            });
        };
        this.port.onMessage.addListener(listener);
    }

    uuid() {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString('36');
    }

    createCallback(callback) {
        let callbackId = this.uuid();
        callbackId = '0'.repeat(11 - callbackId.length) + callbackId;
        this.callbacks.set(callbackId, callback);
        return callbackId;
    }

    doCallback(message) {
        let {_cid: id, data} = message;
        let callback = this.callbacks.get(id);

        if (!callback)
            throw Error('No port callback exists for id:', id);

        this.callbacks.delete(id);

        if (_has(message, 'data'))
            callback(data);
    }

    handleOnMessage(message, callback) {
        if (_has(message, '_cid')) {
            this.doCallback(message);
            return;
        }

        if (_has(message, '_rid')) {
            let dead = false;
            let wait = callback(message.data, response => {
                if (!dead) {
                    dead = true;
                    this.postMessage({
                        data: response,
                        _cid: message._rid
                    });
                }
            });
            if (!wait && !dead) {
                this.postMessage({
                    _cid: message._rid
                });
            }
            return;
        }

        return callback(message.data);
    }

    postMessage(message, callback) {
        let wrapped = {};
        if (_has(message, '_cid')) {
            let {_cid, data} = message;
            wrapped._cid = _cid;
            wrapped.data = data;
        } else {
            wrapped.data = message;
        }
        if (callback) {
            if (!this.hasListener)
                throw Error('Port has no callback');
            let callbackId = this.createCallback(callback);
            wrapped._rid = callbackId;
        }
        return this.port.postMessage(wrapped);
    }
}
