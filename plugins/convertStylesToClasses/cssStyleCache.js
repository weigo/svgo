'use strict';

var NumericValueCleaner = require('./numericValueCleaner');

/**
 * Constructor function for a CssClass.
 *
 * @param styleSpec A string representation of a style attribute: 'style1:value1;style2:value2;...'.
 * @constructor
 */
function CssClass(styleSpec) {
    this.styles = {};

    styleSpec.split(';').forEach(function (style) {
        var spec = style.split(':');
        this.styles[spec[0].trim()] = spec[1].trim();
    }, this);
}

/**
 * Compare a CssClass's properties to the other CssClass.
 * @param other CssClass instance to compare this instancwe with.
 * @returns {boolean} <code>true</code>, when all properties of this class and the other class match,
 * <code>false</code> otherwise.
 */
CssClass.prototype.equalTo = function (other) {
    var thisPropertyNames = Object.keys(this.styles);
    var otherPropertyNames = Object.keys(other.styles);

    return thisPropertyNames.length === otherPropertyNames.length &&
        thisPropertyNames.every(function (property) {
            return this.styles[property] === other.styles[property];
        }, this);
};

/**
 *
 * @param styles
 */
CssClass.prototype.pruneCssStyles = function (styles) {
    if (styles) {
        styles.forEach(function (style) {
            delete this[style];
        }, this.styles);
    }
};

CssClass.prototype.cleanUpNumericValues = function (numericValueCleaner) {
    Object.keys(this.styles).forEach(function (key) {
        this[key] = numericValueCleaner.cleanUpWhenMatches(this[key]);
    }, this.styles);
};

/**
 * Return a string representation of this CssClass as in a <style>-element.
 * @param indent
 * @returns {string}
 */
CssClass.prototype.toCss = function (indent) {
    return '\n' + indent + '.' + this.name + ' {\n' + Object.keys(this.styles).map(function (key) {
            return indent + indent + key + ': ' + this.styles[key];
        }, this).join(';\n') + ';\n' + indent + '}';
};

/**
 * Constructor function for a CssStyleCache.
 *
 * @param params
 * @constructor
 */
function CssStyleCache(params) {
    this.currentClass = 0;
    this.classes = {};
    this.options = params;
    this.indent = ' '.repeat(params.indent);
    this.numericValueCleaner = new NumericValueCleaner(params);
}

/**
 *
 * @param styleSpec
 * @returns {*}
 */
CssStyleCache.prototype.add = function (styleSpec) {
    var name, registeredClasses, cssClass = new CssClass(styleSpec);

    cssClass.pruneCssStyles(this.options.removeCssStyles);
    cssClass.cleanUpNumericValues(this.numericValueCleaner);

    registeredClasses = Object.keys(this.classes).filter(function (registeredClass) {
        return this.classes[registeredClass].equalTo(cssClass);
    }, this);

    if (registeredClasses.length > 0) {
        name = registeredClasses[0];
    } else {
        name = 'c' + this.currentClass;
        cssClass.name = name;
        this.currentClass++;
        this.classes[name] = cssClass;
    }

    return name;
};

/**
 *
 * @returns {string}
 */
CssStyleCache.prototype.toCss = function () {
    return Object.keys(this.classes).map(function (key) {
        return this.classes[key].toCss(this.indent);
    }, this).join('\n');
};

module.exports = CssStyleCache;
