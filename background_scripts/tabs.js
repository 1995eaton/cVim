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

const Tabs = {
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
