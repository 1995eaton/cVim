let Routes = {
    Scroll,
};

ActionHandler = {
    execute({action, repeats}) {
        let [type, name] = action.split('.');
        if (!_has(Routes, type))
            throw Error(`Action type does not exist: ${type}`);
        // log(Routes[type][name], name);
        Routes[type][name](repeats);
    }
};

ActionHandler.actions = {
};
