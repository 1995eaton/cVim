const DEFAULT_SETTINGS = {
    hintCharacters: 'asdfgqwerzxcv',
    scrollstep: 60,
    fullpagescrollpercent: 80,
    scrollduration: 60,
    smoothscroll: false,

    bindings: {
        'gt': 'Tabs.nextTab',
        'gT': 'Tabs.previousTab',
        'K': 'Tabs.nextTab',
        'J': 'Tabs.previousTab',
        'qq': 'Tabs.closeTab',
        '>': 'Tabs.moveTabRight',
        '<': 'Tabs.moveTabLeft',

        'j': 'Scroll.down',
        's': 'Scroll.down',
        'k': 'Scroll.up',
        'w': 'Scroll.up',
        'h': 'Scroll.left',
        'l': 'Scroll.right',
        'd': 'Scroll.pageDown',
        'e': 'Scroll.pageUp',
        'u': 'Scroll.pageUp',
        'gg': 'Scroll.top',
        'G': 'Scroll.bottom',

        'S': 'History.goBack',
        'D': 'History.goForward',
        'H': 'History.goBack',
        'L': 'History.goForward',

        'f': 'Hints.showHints',

        '<C-[>': 'Mode.exitMode',
        '<Esc>': 'Mode.exitMode',

        '<C-s>': 'Settings.send',
    },
};

let userSettings = {};

// TODO: revise and add this to shared_scripts
function extend(a, b) {
    let res = {};
    _props(a).forEach(k => {
        res[k] = a[k];
    });
    _props(b).forEach(k => {
        res[k] = b[k];
    });
    return res;
}

const Settings = {
    get(messenger, key) {
        if (!_has(userSettings, key))
            return DEFAULT_SETTINGS[key];
        return userSettings[key];
    },

    send() {
        let settings = extend(DEFAULT_SETTINGS, userSettings);
        for (let messenger of connection.items.values()) {
            FG(messenger, 'settings', {settings});
        }
    }
};
