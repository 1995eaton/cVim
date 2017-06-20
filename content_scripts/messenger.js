const port = chrome.extension.connect({name: ''});
let messenger = new PortMessenger(port);

const handlers = {
    Scroll,
};

messenger.onMessage((message, callback) => {
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
