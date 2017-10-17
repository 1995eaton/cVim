const port = chrome.extension.connect({name: ''});
port.onDisconnect.addListener(() => {
    Mode.exitMode();
    listener.deactivate();
});

let messenger = new PortMessenger(port);

let settings = {};

messenger.onMessage(message => {
    switch (message.name) {
    case 'settings':
        settings = message.settings;
        addBindings(settings.bindings);
        listener.activate();
        break;
    }
});

port.onDisconnect.addListener(() => {
});

BG = (route, data, callback) => {
    messenger.postMessage({route, ...data}, callback);
};
