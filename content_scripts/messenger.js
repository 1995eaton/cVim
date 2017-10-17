const port = chrome.extension.connect({name: ''});
port.onDisconnect.addListener(() => listener.deactivate());

let messenger = new PortMessenger(port);

messenger.onMessage((message) => {
    log(message);
    switch (message.name) {
    case 'bindings':
        addBindings(message.bindings);
        break;
    }
});

port.onDisconnect.addListener(() => {
});

BG = (route, data, callback) => {
    messenger.postMessage({route, ...data}, callback);
};
