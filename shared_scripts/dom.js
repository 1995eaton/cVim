const Dom = {
    walk: function(root, accept) {
        var nodes = [root];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node = node.firstChild;
            while (node !== null) {
                nodes.push(node);
                node = node.nextSibling;
            }
        }
        nodes.shift();
        return nodes.filter(accept);
    },

    isEditable: function(element) {
        if (!element) {
            return false;
        }
        if (element.localName === 'textarea' ||
                element.localName === 'select' ||
                element.hasAttribute('contenteditable'))
            return true;
        if (element.localName !== 'input')
            return false;
        var type = element.getAttribute('type');
        switch (type) {
        case 'button':
        case 'checkbox':
        case 'color':
        case 'file':
        case 'hidden':
        case 'image':
        case 'radio':
        case 'reset':
        case 'submit':
        case 'week':
            return false;
        }
        return true;
    },

    getVisibleBoundingRect: function(node) {
        var style = getComputedStyle(node, null);
        if (style.visibility !== 'visible' ||
                style.display === 'none') {
            return null;
        }
        if (node.getAttribute('aria-hidden') === 'true')
            return null;

        var rects = node.getClientRects();
        if (rects.length === 0)
            return null;

        var result = null;

        outer:
        for (var i = 0; i < rects.length; i++) {
            var r = rects[i];

            if (r.height <= 1 || r.width <= 1) {
                var children = node.children;
                for (var j = 0; j < children.length; j++) {
                    var child = children[j];
                    var childRect = this.getVisibleBoundingRect(child);
                    if (childRect !== null) {
                        result = childRect;
                        break outer;
                    }
                }
            } else {
                if (r.left + r.width < 5 || r.top + r.height < 5)
                    continue;
                if (innerWidth - r.left < 5 || innerHeight - r.top < 5)
                    continue;

                result = r;
                break;
            }
        }

        if (result !== null) {

            result = {
                left: Math.max(0, result.left),
                right: Math.min(result.right, innerWidth),
                top: Math.max(0, result.top),
                bottom: Math.min(result.bottom, innerHeight),
                width: result.width,
                height: result.height,
            };
        }

        return result;
    },

    /**
     * params =>
     *   id,
     *   class,
     *   attrs,
     *   style,
     */
    createElement(type, attrs, style) {
        let elem = document.createElement(type);
        _props(attrs).forEach(key => elem[key] = attrs[key]);
        if (typeof style === 'string')
            elem.style.cssText = style;
        else
            _props(style).forEach(key => elem.style[key] = style[key]);
        return elem;
    },

    mouseEvent: function(type, element) {
        var events;
        switch (type) {
        case 'hover': events = ['mouseover', 'mouseenter']; break;
        case 'unhover': events = ['mouseout', 'mouseleave']; break;
        case 'click': events = ['mouseover', 'mousedown', 'mouseup', 'click']; break;
        }
        events.forEach(function(eventName) {
            var event = document.createEvent('MouseEvents');
            event.initMouseEvent(eventName, true, true, window, 1, 0, 0, 0, 0, false,
                false, false, false, 0, null);
            element.dispatchEvent(event);
        });
    }
};
