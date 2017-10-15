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

    getVisibleBoundingRect: function(node) {
        var style = getComputedStyle(node, null);
        if (style.visibility !== 'visible' ||
                style.display === 'none') {
            return null;
        }

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
    }
};
