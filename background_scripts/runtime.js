(() => {
    window.C = (function recurse(obj, context) {
        let result = {};
        for (let prop of _props(obj)) {
            if (obj === chrome && prop === 'clipboard')
                continue;
            let value = obj[prop];
            if (typeof value === 'object') {
                result[prop] = recurse(value, obj);
            } else if (typeof value === 'function') {
                result[prop] = promisify(value, context);
            }
        }
        return result;
    })(chrome, null);
})();

FG = (messenger, name, data, callback) => {
    messenger.postMessage({name, ...data}, callback);
};

chrome.commands.onCommand.addListener(command => {
    switch (command) {
    case 'reload-runtime':
        chrome.runtime.reload();
        break;
    }
});

class ConnectionHandler {
    constructor() {
        this.items = new Map();
    }

    has(e) {
        return this.items.has(e);
    }

    get(e) {
        if (!this.items.has(e))
            throw Error('Item not found');
        return this.items.get(e);
    }

    add(port, e) {
        if (this.items.has(port))
            throw Error('Item already in list');
        this.items.set(port, e);
    }

    remove(port) {
        if (!this.items.delete(port))
            throw Error('Item not found');
    }
}

let connection = new ConnectionHandler();

const Routes = {
    Tabs,
    Settings,
};

chrome.tabs.onActivated.addListener((tabId, changeInfo, tab) => {
    console.log(tabId, changeInfo, tab);
});

// reinitializes content-scripts after chrome.runtime.reload() is called
chrome.runtime.onInstalled.addListener(details => {
    log(details);
    const manifest = chrome.runtime.getManifest();
    const contentScripts = manifest.content_scripts[0];
    const checkError = function() { if (chrome.runtime.lastError) return false; };
    C.tabs.query({status: 'complete'}).then(tabs => {
        tabs.forEach(tab => {
            contentScripts.js.forEach(file => {
                chrome.tabs.executeScript(tab.id, {
                    file: file,
                    allFrames: contentScripts.all_fames
                }, checkError);
            });
            contentScripts.css.forEach(file => {
                chrome.tabs.insertCSS(tab.id, {
                    file: file,
                    allFrames: contentScripts.all_fames
                }, checkError);
            });
        });
    });
});

chrome.extension.onConnect.addListener(port => {
    let messenger = new PortMessenger(port);
    connection.add(port, messenger);
    FG(messenger, 'bindings', {bindings});

    messenger.onMessage((message, callback) => {
        let {route, ...data} = message;
        let [type, name] = route.split('.');
        if (!_has(Routes, type))
            throw Error(`Route not found: ${route}`);
        let result = Routes[type][name](messenger, ..._vals(data));
        if (callback)
            callback(result || null);
    });

    port.onDisconnect.addListener(() => {
        connection.remove(port);
    });
});
