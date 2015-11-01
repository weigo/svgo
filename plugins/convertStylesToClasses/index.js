'use strict';

/*
 * Extract styles from elements and convert them into classes. Equal style attributes will get mapped onto one class.
 */

var JSAPI = require('../../lib/svgo/jsAPI'), CssStyleCache = new require('./cssStyleCache');

exports.type = 'full';

exports.active = true;

exports.description = 'extract style attributes into classes. The resulting classes will be unified where possible.';

exports.params = {
    indent: 4,
    removeCssStyles: [],
    numericValueCleaner: {
        floatPrecision: 2,
        leadingZero: true,
        defaultPx: true,
        convertToPx: true
    }
};

/**
 * Walk the element tree and extract style attributes into CSS classes.
 * @param data
 * @param params
 * @returns {*}
 */
exports.fn = function (data, params) {
    var cache = new CssStyleCache(params.numericValueCleaner),
        svg = findElement('svg', data),
        defs, style;

    function extractStyleToClass(item) {
        if (item.hasAttr('style')) {
            var styles = (item.attr('style').value || '').trim(),
                classes = (item.attr('class') ? item.attr('class').value : '').split(/\s+/).filter(function (clazz) {
                    return clazz.trim().length > 0;
                });

            if (styles.length > 0) {
                classes.push(cache.add(styles));
                item.addAttr(new Attribute('class', classes.join(' ')));
            }

            item.removeAttr('style');
        }
    }

    if (svg) {
        defs = findElement('defs', svg);

        if (!defs) {
            defs = newElement('defs', svg);
            svg.content.splice(0, 0, defs);
        }

        style = findElement('style', defs);

        if (!style) {
            style = newElement('style', defs);
            style.addAttr(new Attribute('type', 'text/css'));
            defs.content.push(style);
        }

        visit(data, extractStyleToClass);
        style.content.push(new JSAPI({cdata: cache.toCss()}));
    }

    return data;
};

/**
 * Constructor for a new <code>JSAPI</code> element with the given name and parent.
 * @param name name of new element.
 * @param parent parent element to associate the new element with.
 * @returns {JSAPI} the newly created element.
 */
function newElement(name, parent) {
    var element = new JSAPI({
        elem: name,
        prefix: '',
        local: ''
    }, parent);

    element.content = [];

    return element;
}

/**
 * Visit the given item and recursively apply the function <code>fn</code> to it and it's children.
 * @param item  item to visit.
 * @param fn function to apply to item (and it's children).
 * @returns {*} returns the visited item.
 */
function visit(item, fn) {
    item.content.forEach(function (it) {
        fn(it);

        if (it.content) {
            visit(it, fn);
        }
    });

    return item;
}

/**
 * Constructor function for a new attribute.
 * @param name The new attributes name.
 * @param value The new attributes value.
 * @constructor
 */
function Attribute(name, value) {
    this.name = name;
    this.value = value;
    this.local = '';
    this.prefix = '';
}

/**
 * Find the first element with name <code>name</code> in the given element <code>item</code>.
 * @param name name of element to find.
 * @param item the item use when filtering the children by element name.
 * @returns {*}
 */
function findElement(name, item) {
    var elements = item.content.filter(function (element) {
        return element.isElem(name);
    });

    return elements.length ? elements[0] : undefined;
}
