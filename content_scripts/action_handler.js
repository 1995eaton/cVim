let Routes = {
    Scroll,
    Hints,
};

ActionHandler = {
    execute(action, repeats) {
        let [type, name] = action.split('.');
        if (_has(Routes, type))
            return Routes[type][name](repeats);
        BG(action, { repeats: +repeats || 1 });
    }
};

ActionHandler.actions = {
};
