'use strict';

/*
 * Extract styles from ... elements and convert them into classes. Equal style attributes will get mapped onto one class.
 */

var JSAPI = require('../../lib/svgo/jsAPI'), CssStyleCache = new require('./cssStyleCache');

exports.type = 'full';

exports.active = true;

exports.description = 'extracts styles into classes.';

exports.params = {
    indent: 4,
    removeCssStyles: [],
    addFontStyles: {
        'font-stretch': 'normal'
    },
    floatPrecision: 2,
    leadingZero: true,
    defaultPx: true,
    convertToPx: true
};

exports.fn = function (data, params) {
    var cache = new CssStyleCache(params),
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

        treeWalker(data, extractStyleToClass);
        cache.pruneCssStyles(params.removeCssStyles || []);
        style.content.push(new JSAPI({cdata: cache.toCss()}));
    }

    return data;
};

function newElement(name, parent) {
    var element = new JSAPI({
        elem: name,
        prefix: '',
        local: ''
    }, parent);

    element.content = [];

    return element;
}

function treeWalker(items, fn) {
    items.content.forEach(function (item) {
        fn(item);

        if (item.content) {
            treeWalker(item, fn);
        }
    });

    return items;
}

function Attribute(name, value) {
    this.name = name;
    this.value = value;
    this.local = '';
    this.prefix = '';
}

function findElement(name, data) {
    var elements = data.content.filter(function (element) {
        return element.isElem(name);
    });

    return elements.length ? elements[0] : undefined;
}
