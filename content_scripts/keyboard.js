const KeyListenerMap = {
    'Backspace': 'BS',
    'Numlock': 'Num',
    'Escape': 'Esc',
    ' ': 'Space',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'Print': 'PrintScreen',
};

const KeyListenerLowercaseMap = {
    '~': '`',
    '!': '1',
    '@': '2',
    '#': '3',
    '$': '4',
    '%': '5',
    '^': '6',
    '&': '7',
    '*': '8',
    '(': '9',
    ')': '0',
    '_': '-',
    '+': '=',
    '{': '[',
    '}': ']',
    '<': ',',
    '>': '.',
    '|': '\\',
    '"': '\\',
    '?': '/',
};

const VimKeys = {
    fromEvent({key, shiftKey, altKey, metaKey, ctrlKey}) {
        let mods = [];
        if (ctrlKey) mods.push('C');
        if (altKey) mods.push('A');
        if (metaKey) mods.push('M');
        let isLetter = /^[a-zA-Z]$/.test(key);
        if (_has(KeyListenerMap, key))
            key = KeyListenerMap[key];
        if (shiftKey) {
            if (key.length === 1 && mods.length) {
                if (_has(KeyListenerLowercaseMap, key))
                    key = KeyListenerLowercaseMap[key];
                if (isLetter)
                    key = key.toLowerCase();
                mods.push('S');
            } else if (key.length !== 1) {
                mods.push('S');
            }
        }
        if (mods.length === 0 && key.length === 1)
            return key;
        return `<${mods.concat([key.toLowerCase()]).join('-')}>`;
    },

    toEvent(key) {
        let event = {
            shiftKey: false,
            altKey: false,
            metaKey: false,
            ctrlKey: false,
        };
        if (key.length === 1) {
            event.shiftKey = key.toLowerCase() !== key;
            return {key, ...event};
        }
        if (key.startsWith('<'))
            key = key.slice(1, -1);
        let mods = key.split('-');
        key = mods.pop();
        for (let mod of mods) {
            switch (mod.toLowerCase()) {
            case 'c': event.ctrlKey = true; break;
            case 'a': event.altKey = true; break;
            case 's': event.shiftKey = true; break;
            case 'm': event.metaKey = true; break;
            }
        }
        return {key, ...event};
    },

    normalize(key) {
        return this.fromEvent(this.toEvent(key));
    },

    parseVimSequence(str) {
        let seq = [];
        while (str.length) {
            let match = str.match(/^<([CAMS]-)*[^>]+(>|[a-z])?>/i);
            if (match && match.index === 0) {
                seq.push(str.slice(0, match[0].length));
                str = str.slice(match[0].length);
            } else {
                seq.push(str[0]);
                str = str.slice(1);
            }
        }
        // TODO: fix this
        // seq = seq.match(/(?:<([CAMS]-)*([a-z]+[0-9]+|[^a-z])>)|./gi);
        return seq.map(key => this.normalize(key));
    },

    matches(key1, key2) {
        if (key1 === key2)
            return true;
        let e1 = this.toEvent(key1);
        let e2 = this.toEvent(key2);
        return e1.shiftKey === e2.shiftKey &&
               e1.ctrlKey === e2.ctrlKey &&
               e1.altKey === e2.altKey &&
               e1.metaKey === e2.metaKey &&
               e1.key.toLowerCase() === e2.key.toLowerCase();
    }
};

class KeyboardListener {
    constructor(callback) {
        this.activated = false;
        this.callback = event => {
            let result = this.onKeyDown(event);
            if (!result)
                return;
            callback.call(this, result, event);
        };
    }


    onKeyDown(event) {
        if (['Control', 'Alt', 'Meta', 'Shift'].includes(event.key))
            return event.key;
        return VimKeys.fromEvent(event);
    }

    activate() {
        if (this.activated)
            return false;
        addEventListener('keydown', this.callback, true);
        this.activated = true;
        return true;
    }

    deactivate() {
        if (!this.activated)
            return false;
        removeEventListener('keydown', this.callback, true);
        this.activated = true;
        return true;
    }

    registerListener(name, callback) {
        this.listeners[name] = callback;
    }
}

class Trie {
    constructor(value) {
        this.value = value;
        this.children = {};
        this.isValue = false;
        this.count = 0;
    }

    add(sequence) {
        let node = this;
        for (let item of sequence) {
            if (!_has(node.children, item))
                node.children[item] = new Trie(item);
            node = node.children[item];
            node.count++;
        }
        node.isValue = true;
    }

    _get(sequence) {
        let node = this;
        for (let item of sequence) {
            if (!_has(node.children, item))
                return null;
            node = node.children[item];
        }
        return node;
    }

    get(sequence) {
        let node = this._get(sequence);
        return node && node.isValue ? node.value : null;
    }

    has(sequence) {
        let node = this._get(sequence);
        return node && node.isValue;
    }

    prefixCount(sequence) {
        let prefix = this._get(sequence);
        return prefix === null ? 0 : prefix.count;
    }

    clear() {
        this.count = 0;
        this.isValue = false;
        this.value = undefined;
        this.children = {};
    }
}

let bindings = {};
let bindingTrie = new Trie();
let addBindings = e => {
    for (let [key, val] of _items(e)) {
        let seq = VimKeys.parseVimSequence(key);
        bindings[seq.join('')] = val;
        bindingTrie.add(seq);
    }
};

let sequence = [];
let repeats = '';

const normalListener = (key, event) => {
    if (Dom.isEditable(document.activeElement))
        return;

    if (/[0-9]/.test(key)) {
        if (repeats.length || key !== '0')
            repeats += key;
        return;
    }
    sequence.push(key);
    let prefixCount = bindingTrie.prefixCount(sequence);
    if (prefixCount === 0) {
        sequence = [];
        repeats = '';
    } else {
        if (bindingTrie.has(sequence)) {
            event.stopPropagation();
            event.preventDefault();
            let action = bindings[sequence.join('')];
            log(`"${sequence.join('')}": ${action}`);
            ActionHandler.execute(action, +repeats || 1);
            sequence = [];
            repeats = '';
        }
    }
};

const listener = new KeyboardListener((key, event) => {
    if (bindingTrie.has([key])) {
        let action = bindings[key];
        if (action === 'Mode.exitMode') {
            event.stopPropagation();
            event.preventDefault();
            return Mode.exitMode();
        }
    }

    switch (Mode.mode) {
    case 'normal':
        normalListener.call(this, key, event);
        break;
    case 'hint':
        Mode.callListener('hint', key, event, this);
        break;
    }
});

listener.activate();
