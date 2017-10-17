let Hints = {
    getClickableLinks() {
        let elems = Dom.walk(document.body, node => {
            if (node.nodeType !== Node.ELEMENT_NODE)
                return false;

            let name = node.localName.toLowerCase();
            switch (name) {
            case 'a':
            case 'button':
            case 'area':
            case 'select':
            case 'textarea':
            case 'input':
                return true;
            }

            switch (true) {
            case node.hasAttribute('contenteditable'):
            case node.hasAttribute('tabindex'):
            case node.hasAttribute('onclick'):
            case node.hasAttribute('aria-haspopup'):
            case node.hasAttribute('data-cmd'):
            case node.hasAttribute('jsaction'):
            case node.hasAttribute('data-ga-click'):
            case node.hasAttribute('aria-selected'):
                return true;
            }
        });
        return elems;
    },

    hintCodes(chars, count) {
        let base = chars.length;
        if (count <= base) {
            return chars.slice(0, count).split('');
        }
        let codeWord = function(n, b) {
            let word = [];
            for (let i = 0; i < b; i++) {
                word.push(chars.charAt(n % base));
                n = ~~(n / base);
            }
            return word.reverse().join('');
        };

        let b = Math.ceil(Math.log(count) / Math.log(base));
        let cutoff = Math.pow(base, b) - count;
        let codes0 = [], codes1 = [];

        let codeIndex = 0;
        for (let l = ~~(cutoff / (base - 1)); codeIndex < l; codeIndex++)
            codes0.push(codeWord(codeIndex, b - 1));
        codes0.sort();
        for (; codeIndex < count; codeIndex++)
            codes1.push(codeWord(codeIndex + cutoff, b));
        codes1.sort();
        return codes0.concat(codes1);
    },

    createHintContainer() {
        let shadowRoot = document.createElement('div').createShadowRoot();
        shadowRoot.innerHTML = `
#cvim-hint-container {
    position: absolute;
    top: ${document.scrollingElement.scrollTop}px;
    left: ${document.scrollingElement.scrollLeft}px;
    backgroundColor: rgba(0,0,0,0.25);
}`;
        let hintContainer = Dom.createElement('div', {id: 'cvim-hint-container'}, {
            position: 'absolute',
            top: document.scrollingElement.scrollTop + 'px',
            height: '100%',
            left: document.scrollingElement.scrollLeft + 'px',
            width: '100%',
        });
        shadowRoot.appendChild(hintContainer);
        return hintContainer;
    },

    createHintElem(hint) {
        let hintElem = Dom.createElement('div', {className: 'cvim-hint'}, {
            position: 'absolute',
            top: ~~hint.linkRect.top + 'px',
            left: ~~hint.linkRect.left + 'px',
        });
        hintElem.textContent = hint.code;
        return hintElem;
    },

    /**
     * returns {
     *     link: link element,
     *     linkRect: link bounding rect,
     *     code: hint text,
     * }
     */
    getHints() {
        let links = this.getClickableLinks();
        let hints = [];
        links.forEach(link => {
            let linkRect = Dom.getVisibleBoundingRect(link);
            if (!linkRect)
                return;
            let hint = {
                link,
                linkRect,
            };

            hints.push(hint);
        });
        let codes = this.hintCodes(this.hintCharacters, hints.length);
        hints.forEach((hint, i) => {
            hint.code = codes[i];
            hint.hintElem = this.createHintElem(hint);
        });
        return hints;
    },

    enterMode() {},
    exitMode() {
        this.hints = [];
        this.hintContainer.remove();
        this.hintCharacters = undefined;
    },

    openHint(hint) {
        let {link} = hint;
        let name = link.localName;
        if (Dom.isEditable(link)) {
            switch (name) {
            case 'select':
                link.focus();
                Dom.mouseEvent('click', link);
                return;
            }
            link.focus();
            return;
        }
        Dom.mouseEvent('click', link);
    },

    listener(key, event) {
        if (['Control', 'Alt', 'Meta', 'Shift'].includes(event.key)) {
            event.stopPropagation();
            return;
        }
        event.stopPropagation();
        event.preventDefault();

        let remove = [];
        let picked = null;
        Hints.hints.forEach((hint, index) => {
            let {hintElem} = hint;
            if (hintElem.textContent[0] === key) {
                hintElem.textContent = hintElem.textContent.slice(1);
                if (hintElem.textContent.length === 0)
                    picked = hint;
            } else {
                remove.push(index);
            }
        });
        let dec = 0;
        remove.forEach(index => {
            Hints.hints[index + dec].hintElem.remove();
            Hints.hints.splice(index + dec, 1);
            dec -= 1;
        });
        if (picked) {
            Mode.exitMode();
            Hints.openHint(picked);
            return;
        }
        if (Hints.hints.length === 0) {
            Mode.exitMode();
        }
    },

    showHints() {
        if (!this.hintCharacters) {
            BG('Settings.get', {key: 'hintCharacters'}, hintCharacters => {
                log(`Got Hint characters: ${hintCharacters}`);
                this.hintCharacters = hintCharacters;
                this.showHints();
            });
            return;
        }
        Mode.enterMode('hint');
        let hintContainer = this.createHintContainer();
        hintContainer.style.zIndex = '2147483647';
        document.lastChild.appendChild(hintContainer);
        let hints = this.getHints();
        hints.forEach(hint => {
            hintContainer.appendChild(hint.hintElem);
        });
        this.hints = hints;
        this.hintContainer = hintContainer;
        if (hints.length === 0) {
            Mode.exitMode();
            return;
        }
    },
};

Mode.addMode('hint', Hints);
