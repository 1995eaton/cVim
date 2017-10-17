let Routes = {
    Scroll,
    Hints,
    History,
};

ActionHandler = {
    execute(action, repeats) {
        let [type, name] = action.split('.');
        if (_has(Routes, type) && _has(Routes[type], name))
            return Routes[type][name](repeats);
        BG(action, { repeats: +repeats || 1 });
    }
};

ActionHandler.actions = {
};
