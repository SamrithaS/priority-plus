import deepmerge from 'deepmerge';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var Events;
(function (Events) {
    Events["Init"] = "init";
    Events["ShowOverflow"] = "showOverflow";
    Events["HideOverflow"] = "hideOverflow";
    Events["ItemsChanged"] = "itemsChanged";
})(Events || (Events = {}));
function createEvent(name, payload) {
    if (payload === void 0) { payload = {}; }
    return new CustomEvent(name, {
        detail: payload
    });
}
function createShowOverflowEvent() {
    return createEvent(Events.ShowOverflow);
}
function createHideOverflowEvent() {
    return createEvent(Events.HideOverflow);
}
function createInitEvent() {
    return createEvent(Events.Init);
}
function createItemsChangedEvent(_a) {
    var overflowCount = _a.overflowCount;
    return createEvent(Events.ItemsChanged, { overflowCount: overflowCount });
}
//# sourceMappingURL=createEvent.js.map

function eventTarget() {
    var port1 = new MessageChannel().port1;
    return {
        addEventListener: port1.addEventListener.bind(port1),
        dispatchEvent: port1.dispatchEvent.bind(port1),
        removeEventListener: port1.removeEventListener.bind(port1)
    };
}
//# sourceMappingURL=eventTarget.js.map

/**
 * Joins an array of error messages into one message.
 */
function throwValidation(errors) {
    if (errors && errors.length)
        throw new Error("\n- " + errors.join('\n- '));
}
/**
 * Confirms the target DOM element is of the required type.
 */
function validateTarget(targetElem) {
    return [
        (!(targetElem instanceof Element))
            && 'Target must be an HTMLElement.',
        (!targetElem.children || !targetElem.children.length)
            && 'Target must be the direct parent of the individual nav items.',
    ].filter(Boolean);
}
/**
 * Confirms that the top-level options keys are valid. Does not check type.
 */
function validateOptions(userOptions, defaultOptions) {
    return Object.keys(userOptions)
        .map(function (key) { return !defaultOptions[key] ? "Unrecognised option: " + key : undefined; })
        .filter(Boolean);
}
/**
 * Collects validation messages into one array.
 */
function validateInput(targetElem, userOptions, defaultOptions) {
    return validateTarget(targetElem).concat(validateOptions(userOptions, defaultOptions));
}
/**
 * Throws an error if any error messages are returned from validation.
 */
function validateAndThrow(targetElem, userOptions, defaultOptions) {
    throwValidation(validateInput(targetElem, userOptions, defaultOptions));
}
//# sourceMappingURL=validation.js.map

var _a;
var El;
(function (El) {
    El["Container"] = "container";
    El["Main"] = "main";
    El["PrimaryNavWrapper"] = "primary-nav-wrapper";
    El["PrimaryNav"] = "primary-nav";
    El["OverflowNav"] = "overflow-nav";
    El["ToggleBtn"] = "toggle-btn";
    El["NavItems"] = "nav-item";
})(El || (El = {}));
var StateModifiers;
(function (StateModifiers) {
    StateModifiers["ButtonVisible"] = "is-showing-toggle";
    StateModifiers["OverflowVisible"] = "is-showing-overflow";
    StateModifiers["PrimaryHidden"] = "is-hiding-primary";
})(StateModifiers || (StateModifiers = {}));
var defaultOptions = {
    classNames: (_a = {},
        _a[El.Container] = ['p-plus-container'],
        _a[El.Main] = ['p-plus'],
        _a[El.PrimaryNavWrapper] = ['p-plus__primary-wrapper'],
        _a[El.PrimaryNav] = ['p-plus__primary'],
        _a[El.OverflowNav] = ['p-plus__overflow'],
        _a[El.ToggleBtn] = ['p-plus__toggle-btn'],
        _a),
    innerToggleTemplate: 'More'
};
function pplus(targetElem, userOptions) {
    var _a, _b;
    /**
     * The instance's event emitter.
     */
    var eventChannel = eventTarget();
    /**
     * A map of navigation list items to their current designation (either the
     * primary nav or the overflow nav), based on if they 'fit'.
     */
    var itemMap = new Map();
    var options = deepmerge(defaultOptions, userOptions || {}, { arrayMerge: function (_, source) { return source; } });
    var classNames = options.classNames;
    /**
     * References to DOM elements so we can easily retrieve them.
     */
    var el = {
        clone: (_a = {},
            _a[El.Main] = undefined,
            _a[El.NavItems] = undefined,
            _a[El.ToggleBtn] = undefined,
            _a),
        primary: (_b = {},
            _b[El.Main] = undefined,
            _b[El.PrimaryNav] = undefined,
            _b[El.NavItems] = undefined,
            _b[El.OverflowNav] = undefined,
            _b[El.ToggleBtn] = undefined,
            _b)
    };
    /**
     * Gets an element's 'mirror' Map for the clone/primary navigation - e.g.
     * if you pass a clone Map, you get the original Map and vice-versa.
     */
    var getElemMirror = (function () {
        var cache = new Map();
        return function getMirror(keyArr, valueArr) {
            if (!cache.get(keyArr)) {
                cache.set(keyArr, new Map(Array.from(keyArr).reduce(function (acc, item, i) { return (acc.concat([[item, valueArr[i]]])); }, [])));
            }
            return cache.get(keyArr);
        };
    })();
    /**
     * Generates classes based on an element name.
     */
    function cn(key) {
        return classNames[key].join(' ');
    }
    /**
     * Generates data-attributes based on an element name. These are used to query
     * the generated DOM and populate the 'el' object.
     */
    function dv(key) {
        return "data-" + key;
    }
    /**
     * Takes a string/function template and returns a DOM string.
     */
    function processTemplate(input, args) {
        if (args === void 0) { args = {}; }
        if (typeof input === 'string')
            return input;
        return input(args);
    }
    /**
     * Generates the HTML to use in-place of the user's supplied element.
     */
    function createMarkup() {
        return "\n      <div " + dv(El.Main) + " class=\"" + cn(El.Main) + "\">\n        <div class=\"" + cn(El.PrimaryNavWrapper) + "\">\n          <" + targetElem.tagName + "\n            " + dv(El.PrimaryNav) + "\n            class=\"" + cn(El.PrimaryNav) + "\"\n          >\n            " + Array.from(targetElem.children).map(function (elem) { return ("<li " + dv(El.NavItems) + ">" + elem.innerHTML + "</li>"); }).join('') + "\n          </" + targetElem.tagName + ">\n        </div>\n        <button\n          " + dv(El.ToggleBtn) + "\n          class=\"" + cn(El.ToggleBtn) + "\"\n          aria-expanded=\"false\"\n        >" + processTemplate(options.innerToggleTemplate) + "</button>\n        <" + targetElem.tagName + "\n          " + dv(El.OverflowNav) + "\n          class=\"" + cn(El.OverflowNav) + "\"\n          aria-hidden=\"true\"\n        >\n        </" + targetElem.tagName + ">\n      </div>\n    ";
    }
    /**
     * Replaces the navigation with the two clones and populates the 'el' object.
     */
    function setupEl() {
        var _a;
        var markup = createMarkup();
        var container = document.createElement('div');
        (_a = container.classList).add.apply(_a, classNames[El.Container]);
        var original = document.createRange().createContextualFragment(markup);
        var cloned = original.cloneNode(true);
        el.primary[El.Main] = original.querySelector("[" + dv(El.Main) + "]");
        el.primary[El.PrimaryNav] = original.querySelector("[" + dv(El.PrimaryNav) + "]");
        el.primary[El.NavItems] = Array.from(original.querySelectorAll("[" + dv(El.NavItems) + "]"));
        el.primary[El.OverflowNav] = original.querySelector("[" + dv(El.OverflowNav) + "]");
        el.primary[El.ToggleBtn] = original.querySelector("[" + dv(El.ToggleBtn) + "]");
        el.clone[El.Main] = cloned.querySelector("[" + dv(El.Main) + "]");
        el.clone[El.NavItems] = Array.from(cloned.querySelectorAll("[" + dv(El.NavItems) + "]"));
        el.clone[El.ToggleBtn] = cloned.querySelector("[" + dv(El.ToggleBtn) + "]");
        el.clone[El.Main].setAttribute('aria-hidden', 'true');
        el.clone[El.Main].classList.add(classNames[El.Main] + "--clone");
        el.clone[El.Main].classList.add(classNames[El.Main] + "--" + StateModifiers.ButtonVisible);
        container.appendChild(original);
        container.appendChild(cloned);
        // By default every item belongs in the primary nav, since the intersection
        // observer will run on-load anyway.
        el.clone[El.NavItems].forEach(function (item) { return itemMap.set(item, El.PrimaryNav); });
        targetElem.parentNode.replaceChild(container, targetElem);
    }
    /**
     * Sets the toggle button visibility.
     */
    function updateBtnDisplay(show) {
        if (show === void 0) { show = true; }
        el.primary[El.Main].classList[show ? 'add' : 'remove'](classNames[El.Main] + "--" + StateModifiers.ButtonVisible);
        if (typeof options.innerToggleTemplate !== 'string') {
            // We need to do it for both, as layout is affected
            [el.primary[El.ToggleBtn], el.clone[El.ToggleBtn]].forEach(function (btn) {
                btn.innerHTML = processTemplate(options.innerToggleTemplate, {
                    toggleCount: el.primary[El.OverflowNav].children.length,
                    totalCount: el.clone[El.NavItems].length
                });
            });
        }
    }
    /**
     * (Re) generate the navigation list for either the visible or the overflow nav.
     * We use this to completely recreate the nav each time we update it,
     * avoiding ordering complexity and having to run append multiple times on
     * the mounted nav.
     */
    function generateNav(navType) {
        var newNav = el.primary[navType].cloneNode();
        // Always use the clone as the base for our new nav,
        // since the order is canonical and it is never filtered.
        el.clone[El.NavItems]
            .filter(function (item) { return itemMap.get(item) === navType; })
            .forEach(function (item) {
            newNav.appendChild(getElemMirror(el.clone[El.NavItems], el.primary[El.NavItems]).get(item));
        });
        return newNav;
    }
    /**
     * Replaces the passed in nav type with a newly generated copy in the DOM.
     */
    function updateNav(navType) {
        var newNav = generateNav(navType);
        // Replace the existing nav element in the DOM
        el.primary[navType].parentNode.replaceChild(newNav, el.primary[navType]);
        // Update our reference to it
        el.primary[navType] = newNav;
    }
    /**
     * Run every time a nav item intersects with the parent container.
     * We use this opporunity to check which type of nav the items belong to.
     */
    function onIntersect(_a) {
        var target = _a.target, intersectionRatio = _a.intersectionRatio;
        itemMap.set(target, intersectionRatio < 1 ? El.OverflowNav : El.PrimaryNav);
    }
    /**
     * The IO callback, which collects intersection events.
     */
    function intersectionCallback(events) {
        // Update the designation
        events.forEach(onIntersect);
        // Update the navs to reflect the new changes
        [El.PrimaryNav, El.OverflowNav].forEach(updateNav);
        eventChannel.dispatchEvent(createItemsChangedEvent({
            overflowCount: el.primary[El.OverflowNav].children.length
        }));
    }
    /**
     * Sets the visibility of the overflow navigation.
     */
    function setOverflowNavOpen(open) {
        if (open === void 0) { open = true; }
        var openClass = classNames[El.Main] + "--" + StateModifiers.OverflowVisible;
        el.primary[El.Main].classList[open ? 'add' : 'remove'](openClass);
        el.primary[El.OverflowNav].setAttribute('aria-hidden', open ? 'false' : 'true');
        el.primary[El.ToggleBtn].setAttribute('aria-expanded', open ? 'true' : 'false');
        eventChannel.dispatchEvent(open ? createShowOverflowEvent() : createHideOverflowEvent());
    }
    /**
     * Toggles the visibility of the overflow navigation.
     */
    function toggleOverflowNav() {
        var openClass = classNames[El.Main] + "--" + StateModifiers.OverflowVisible;
        setOverflowNavOpen(!el.primary[El.Main].classList.contains(openClass));
    }
    /**
     * Sets the visibility of the primary navigation (we hide the primary nav
     * when all the navigation items are hidden in the overflow nav).
     */
    function setPrimaryHidden(hidden) {
        if (hidden === void 0) { hidden = true; }
        var hiddenClass = classNames[El.Main] + "--" + StateModifiers.PrimaryHidden;
        el.primary[El.Main].classList[hidden ? 'add' : 'remove'](hiddenClass);
        el.primary[El.PrimaryNav].setAttribute('aria-hidden', String(hidden));
    }
    /**
     * Handle the overflow-nav toggle btn click.
     */
    function onToggleClick(e) {
        e.preventDefault();
        toggleOverflowNav();
    }
    /**
     * Callback for when either nav is updated.
     */
    function onItemsChanged(_a) {
        var overflowCount = _a.detail.overflowCount;
        updateBtnDisplay(overflowCount > 0);
        if (overflowCount === 0) {
            setOverflowNavOpen(false);
        }
        setPrimaryHidden(overflowCount === el.clone[El.NavItems].length);
    }
    /**
     * Creates an event listener.
     */
    function on(eventType, cb) {
        return eventChannel.addEventListener(eventType, cb);
    }
    /**
     * Removes an event listener.
     */
    function off(eventType, cb) {
        return eventChannel.removeEventListener(eventType, cb);
    }
    /**
     * Retrives an index of the primary nav elements.
     */
    function getNavElements() {
        // Clone it to avoid users changing the el references,
        // e.g. inst.getNavElements()['toggle-btn'] = null;
        return __assign({}, el.primary);
    }
    /**
     * Establishes initial event listeners.
     */
    function bindListeners() {
        var observer = new IntersectionObserver(intersectionCallback, {
            root: el.clone[El.Main],
            rootMargin: '0px 0px 0px 0px',
            threshold: [1]
        });
        el.clone[El.NavItems].forEach(function (elem) { return observer.observe(elem); });
        el.primary[El.ToggleBtn].addEventListener('click', onToggleClick);
        eventChannel.addEventListener(Events.ItemsChanged, onItemsChanged);
    }
    (function init() {
        validateAndThrow(targetElem, userOptions, defaultOptions),
            setupEl();
        bindListeners();
        eventChannel.dispatchEvent(createInitEvent());
    }());
    return {
        getNavElements: getNavElements,
        off: off,
        on: on,
        setOverflowNavOpen: setOverflowNavOpen,
        toggleOverflowNav: toggleOverflowNav
    };
}
//# sourceMappingURL=pplus.js.map

export default pplus;
