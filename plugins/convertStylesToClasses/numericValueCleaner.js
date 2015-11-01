'use strict';

function NumericValueCleaner(options) {
    this.floatPrecision = options.floatPrecision || 3;
    this.leadingZero = options.leadingZero || true;
    this.defaultPx = options.defaultPx || true;
    this.convertToPx = options.convertToPx || true;
    this.regNumericValues = /^([\-+]?\d*\.?\d+([eE][\-+]?\d+)?)(px|pt|pc|mm|cm|m|in|ft|em|ex|%)?$/;
    this.removeLeadingZero = require('../../lib/svgo/tools').removeLeadingZero;
    this.absoluteLengths = { // relative to px
        cm: 96 / 2.54,
        mm: 9600 / 2.54,
        in: 96,
        pt: 4 / 3,
        pc: 16
    };
}

NumericValueCleaner.prototype = {
    cleanUpWhenMatches: function (value) {
        var match = value.match(this.regNumericValues);

        // if attribute value matches regNumericValues
        if (match) {
            // round it to the fixed precision
            var num = +(+match[1]).toFixed(this.floatPrecision),
                units = match[3] || '';

            // convert absolute values to pixels
            if (this.convertToPx && units && (units in this.absoluteLengths)) {
                var pxNum = +(this.absoluteLengths[units] * match[1]).toFixed(this.floatPrecision);

                if (String(pxNum).length < match[0].length) {
                    num = pxNum;
                    units = 'px';
                }
            }

            // and remove leading zero
            if (this.leadingZero) {
                num = this.removeLeadingZero(num);
            }

            // remove default 'px' units
            if (this.defaultPx && this.units === 'px') {
                units = '';
            }

            return num + units;
        }

        return value;
    }
};

module.exports = NumericValueCleaner;
