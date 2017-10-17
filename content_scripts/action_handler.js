let Routes = {
    Scroll,
    Hints,
};

ActionHandler = {
    execute({route, repeats}) {
        let [type, name] = route.split('.');
        if (!_has(Routes, type))
            throw Error(`Route does not exist: ${type}`);
        Routes[type][name](repeats);
    }
};

ActionHandler.actions = {
};
