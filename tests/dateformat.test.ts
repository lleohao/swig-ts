import swig, { Swig } from '../lib/swig';
import _ = require('lodash');
import should = require('should');

function makeDate(tzOffset?, y?, m?, d?, h?, i?, s?) {
    var date = new Date(y, m || 0, d || 0, h || 0, i || 0, s || 0),
        offset = date.getTimezoneOffset();

    if (offset !== tzOffset) { // timezone offset in PST for september
        date = new Date(date.getTime() - ((offset * 60000) - (tzOffset * 60000)));
    }

    return date;
}

const d = makeDate(420, 2011, 8, 6, 9, 5, 2);
const cases = {
    date: [
        // Day
        { c: 'v|date("d")', v: d, e: '06' },
        { c: 'v|date("D")', v: d, e: 'Tue' },
        { c: 'v|date("j")', v: d, e: '6' },
        { c: 'v|date("l")', v: d, e: 'Tuesday' },
        { c: 'v|date("N")', v: d, e: '2' },
        { c: 'v|date("N")', v: makeDate(420, 2011, 8, 4), e: '7' },
        { c: 'v|date("S")', v: d, e: 'th' },
        { c: 'v|date("w")', v: d, e: '2' },
        { c: 'v|date("z")', v: d, e: '248' },
        { c: 'v|date("z", 480)', v: makeDate(480, 2011, 0, 1), e: '0' },
        { c: 'v|date("z", 480)', v: makeDate(480, 2011, 11, 31), e: '364' },

        // Week
        { c: 'v|date("W")', v: d, e: '37' },

        // Month
        { c: 'v|date("F")', v: d, e: 'September' },
        { c: 'v|date("m")', v: d, e: '09' },
        { c: 'v|date("M")', v: d, e: 'Sep' },
        { c: 'v|date("n")', v: d, e: '9' },
        { c: 'v|date("t")', v: d, e: '30' },

        // Year
        { c: 'v|date("L")', v: d, e: 'false' },
        { c: 'v|date("L", 480)', v: makeDate(480, 2008, 1, 29), e: 'true' },
        { c: 'v|date("o")', v: d, e: '2011' },
        { c: 'v|date("o", 480)', v: makeDate(480, 2011, 0, 1), e: '2010' },
        { c: 'v|date("Y")', v: d, e: '2011' },
        { c: 'v|date("y")', v: d, e: '11' },

        // Time
        { c: 'v|date("a")', v: d, e: 'am' },
        { c: 'v|date("A")', v: d, e: 'AM' },
        { c: 'v|date("B")', v: d, e: '712' },
        { c: 'v|date("g")', v: d, e: '9' },
        { c: 'v|date("G")', v: d, e: '9' },
        { c: 'v|date("h")', v: d, e: '09' },
        { c: 'v|date("h", 480)', v: makeDate(480, 2011, 0, 1, 10), e: '10' },
        { c: 'v|date("H")', v: d, e: '09' },
        { c: 'v|date("i")', v: d, e: '05' },
        { c: 'v|date("s")', v: d, e: '02' },
        { c: 'v|date("d-m-Y")', v: d, e: '06-09-2011' },

        // Timezone
        { c: 'v|date("O")', v: d, e: '+0700' },
        { c: 'v|date("O", -120)', v: makeDate(-120, 2011, 0, 2), e: '-0200' },
        { c: 'v|date("Z")', v: d, e: '25200' },
        { c: 'v|date("O", 360)', v: d, e: '+0600' },
        { c: 'v|date("G", 320)', v: d, e: '10' },

        // Full Date/Time
        { c: 'v|date("c")', v: d, e: '2011-09-06T16:05:02.000Z' },
        { c: 'v|date("r")', v: d, e: 'Tue, 06 Sep 2011 16:05:02 GMT' },
        { c: 'v|date("U")', v: d, e: '1315325102' },

        // More complete S ordinal testing
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 1), e: 'st' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 2), e: 'nd' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 3), e: 'rd' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 4), e: 'th' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 10), e: 'th' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 11), e: 'th' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 12), e: 'th' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 13), e: 'th' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 21), e: 'st' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 22), e: 'nd' },
        { c: 'v|date("S")', v: makeDate(420, 2011, 8, 23), e: 'rd' },

        // Escape character
        { c: 'v|date("\\D")', v: d, e: 'D' },
        { c: 'v|date("\\t\\e\\s\\t")', v: d, e: 'test' },
        { c: 'v|date("\\\\D")', v: d, e: '\\Tue' },
        { c: 'v|date("jS \\o\\f F")', v: makeDate(420, 2012, 6, 4), e: '4th of July' }
    ]
}

describe('Dateformat', function () {
    const s = new Swig();

    // it('defaultTZOffset affects date filter', function () {
    //     swig.setDefaultTZOffset(240);
    //     const d = 1316761200000;
    //     should(s.render('{{ v|date("Y-m-d H:i a") }}', { locals: { v: d } }))
    //         .be.equal('2011-09-23 03:00 am');
    //     swig.setDefaultTZOffset(0);
    // });

    _.each(cases, function (cases, filter) {
        describe(filter, function () {
            _.each(cases, function (c) {
                var code = '{{ ' + (c.c || 'v|' + filter) + ' }}',
                    clone = _.cloneDeep(c.v);
                it(code + ', v=' + JSON.stringify(c.v) + ' should render ' + c.e.replace(/\n/g, '\\n'), function () {
                    if ((/\|date\(/).test(code)) {
                        code = '{{ ' + c.c.replace(/\"\)$/, '", 420)') + ' }}';
                    }
                    should(s.render(code, { locals: { v: c.v } }))
                        .be.eql(c.e);
                });
                it(code + ', v=' + JSON.stringify(clone) + ' should should not mutate value', function () {
                    should(c.v).be.eql(clone);
                });
            });
        });
    });
});