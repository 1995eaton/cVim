let Mode = {
    modeObjects: {},
    mode: 'normal',

    addMode(name, obj) {
        this.modeObjects[name] = obj;
    },

    enterMode(mode) {
        this.exitMode();
        if (mode !== 'normal') {
            this.modeObjects[mode].enterMode();
        }
        this.mode = mode;
    },

    exitMode() {
        if (this.mode !== 'normal') {
            if (!this.modeObjects[this.mode].exitMode())
                this.mode = 'normal';
        } else {
            document.activeElement.blur();
        }
    },

    callListener(mode, key, event, caller) {
        this.modeObjects[mode].listener.call(caller, key, event);
    },
};
