'use strict';

/*
 * Extract styles from ... elements and convert them into classes. Equal style attributes will get mapped onto one class.
 */

exports.type = 'full';

exports.active = true;

exports.description = 'extracts styles into classes.';

exports.params = {
    indent: 4,
    removeCssStyles: [],
    addFontStyles: {}
};

exports.fn = function (data, params) {
    var indent = ' '.repeat(params.indent);

    function Attribute(name, value) {
        this.name = name;
        this.value = value;
        this.local = '';
        this.prefix = '';
    }

    function CssClass(styleSpec) {
        this.styles = {};

        styleSpec.split(';').forEach(function (style) {
            var spec = style.split(':');
            this.styles[spec[0].trim()] = spec[1].trim();
        }, this);
    }

    CssClass.prototype = {
        equalTo: function (other) {
            var thisPropertyNames = Object.keys(this.styles);
            var otherPropertyNames = Object.keys(other.styles);

            return thisPropertyNames.length === otherPropertyNames.length
                && thisPropertyNames.every(function (property) {
                    return this.styles[property] === other.styles[property];
                }, this);
        },
        toCss: function () {
            return '\n' + indent + '.' + this.name + ' {\n' + Object.keys(this.styles).map(function (key) {
                    return indent + indent + key + ': ' + this.styles[key];
                }, this).join(';\n') + ';\n' + indent + '}';
        }
    };

    function CssClassCache() {
        this.currentClass = 0;
        this.classes = {};
    }

    CssClassCache.prototype = {
        add: function (cssClass) {
            var name, registeredClasses = Object.keys(this.classes).filter(function (registeredClass) {
                return this.classes[registeredClass].equalTo(cssClass);
            }, this);

            if (registeredClasses.length > 0) {
                name = registeredClasses[0];
            } else {
                name = "cl" + this.currentClass;
                cssClass.name = name;
                this.currentClass++;
                this.classes[name] = cssClass;
            }

            return name;
        },
        toCss: function () {
            return Object.keys(this.classes).map(function (key) {
                return this.classes[key].toCss();
            }, this).join('\n');
        },
        pruneCssStyles: function (styles) {
            if (styles) {
                Object.keys(this.classes).forEach(function (key) {
                    styles.forEach(function (style) {
                        delete this[style];
                    }, this.classes[key].styles);
                }, this);
            }
        }
    };

    function findElement(name, data) {
        var elements = data.content.filter(function (element) {
            return element.isElem(name);
        });

        return elements.length ? elements[0] : undefined;
    }

    var JSAPI = require('../lib/svgo/jsAPI'),
        cache = new CssClassCache(),
        svg = findElement('svg', data),
        defs, style;

    function isElementWithStyleAttribute(item) {
        return item.hasAttr('style');
    }

    function extractStyleToClass(element) {
        var styles = (element.attr('style') ? element.attr('style').value : '').trim(),
            classes = (element.attr('class') ? element.attr('class').value : '').split(/\s+/).filter(function (clazz) {
                return clazz.trim().length > 0;
            });

        if (styles.length > 0) {
            // TODO: probably add font-style to improve font stretching
            // TODO: add rounding of font sizes to improve class merging!
            classes.push(cache.add(new CssClass(styles)));
            element.addAttr(new Attribute('class', classes.join(' ')));
        }

        element.removeAttr('style');
    }

    function extractClassesFromElementsWithStyleAttribute(children) {
        if (children) {
            children.forEach(function (item) {
                if (isElementWithStyleAttribute(item)) {
                    extractStyleToClass(item);
                }

                if (item.content) {
                    extractClassesFromElementsWithStyleAttribute(item.content);
                }
            });
        }
    }

    if (svg) {
        defs = findElement('defs', svg);

        if (!defs) {
            defs = new JSAPI({
                elem: 'defs',
                prefix: '',
                local: ''
            }, svg);
            defs.content = [];
            svg.content.splice(0, 0, defs);
        }

        style = findElement('style', defs);

        if (!style) {
            style = new JSAPI({
                elem: 'style',
                prefix: '',
                local: ''
            }, svg);

            style.addAttr(new Attribute('type', 'text/css'));
            style.content = [];

            defs.content.push(style);
        }

        extractClassesFromElementsWithStyleAttribute(data.content);
        cache.pruneCssStyles(params.removeCssStyles || []);
        style.content.push(new JSAPI({cdata: cache.toCss()}));
    }

    return data;
};
