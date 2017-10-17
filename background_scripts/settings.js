const DEFAULT_SETTINGS = {
    hintCharacters: 'asdfgqwerzxcv',
};

let userSettings = {};

const Settings = {
    get(messenger, key) {
        if (!_has(userSettings, key))
            return DEFAULT_SETTINGS[key];
        return userSettings[key];
    }
};
