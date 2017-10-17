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
        }
    },

    callListener(mode, key, event) {
        this.modeObjects[mode].listener.call(event, key, event);
    },
};
