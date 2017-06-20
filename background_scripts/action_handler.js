ActionHandler = {
    execute({action, repeats}, conn) {
        if (!_has(this.actions, action)) {
            return {action, repeats};
        }
        this.actions[action](conn, repeats);
    }
};

const promisify = (method, context) => {
    return (...args) => {
        return new Promise(resolve => {
            method.call(context, ...args, (...args) => {
                resolve(...args);
            });
        });
    };
};

(() => {
    window.C = (function recurse(obj, context) {
        let result = {};
        for (let prop of _props(obj)) {
            if (obj === chrome && prop === 'clipboard')
                continue;
            let value = obj[prop];
            if (typeof value === 'object') {
                result[prop] = recurse(value, obj);
            } else if (typeof value === 'function') {
                result[prop] = promisify(value, context);
            }
        }
        return result;
    })(chrome, null);
})();

const cycleTab = (conn, offset) => {
    C.tabs.query({windowId: conn.windowId}).then(tabs => {
        let index = conn.tab.index + offset;
        if (Math.abs(offset) === 1) {
            index = ((index % tabs.length) + tabs.length) % tabs.length;
        } else {
            index = Math.max(0, Math.min(tabs.length - 1, index));
        }
        C.tabs.update(tabs[index].id, {highlighted: true, active: true});
    });
};

const moveTab = (conn, n) => {
    C.tabs.move(conn.tabId, {
        index: Math.max(0, conn.tab.index + n)
    });
};

ActionHandler.actions = {
    nextTab(conn, repeats) {
        return cycleTab(conn, repeats);
    },
    previousTab(conn, repeats) {
        return cycleTab(conn, -repeats);
    },
    closeTab({windowId, ...conn}, repeats) {
        C.tabs.query({windowId}).then(tabs => {
            let tabIds = tabs.map(tab => tab.id);
            let index = conn.tab.index;
            if (repeats < tabIds.length) {
                index -= Math.max(0, index + repeats - tabIds.length);
                tabIds = tabIds.slice(index, index + repeats);
            }
            C.tabs.remove(tabIds);
        });
    },
    moveTabRight(conn, repeats) {
        moveTab(conn, repeats);
    },
    moveTabLeft(conn, repeats) {
        moveTab(conn, -repeats);
    },
};
