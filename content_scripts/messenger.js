const port = chrome.extension.connect({name: ''});
port.onDisconnect.addListener(() => {
    Mode.exitMode();
    listener.deactivate();
});

let messenger = new PortMessenger(port);

messenger.onMessage((message) => {
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
