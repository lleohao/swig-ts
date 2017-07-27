import utils from './utils';

const _months = {
    full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    abbr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};
const _days = {
    full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    abbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    alt: { '-1': 'Yesterday', 0: 'Today', 1: 'Tomorrow' }
}

/*
DateZ is licensed under the MIT License:
Copyright (c) 2011 Tomo Universalis (http://tomouniversalis.com)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
let tzOffset = 0;

export class DateZ {
    members = {
        'default': ['getUTCDate', 'getUTCDay', 'getUTCFullYear', 'getUTCHours', 'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds', 'toISOString', 'toGMTString', 'toUTCString', 'valueOf', 'getTime'],
        z: ['getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds', 'getYear', 'toDateString', 'toLocaleDateString', 'toLocaleTimeString']
    };
    date: Date;
    dateZ: Date;
    timezoneOffset: number;

    constructor(...args) {
        this.date = this.dateZ = (args.length > 1) ? new Date(Date.UTC.apply(Date, args) + ((new Date()).getTimezoneOffset() * 60000)) : (args.length === 1) ? new Date(new Date(args[0])) : new Date();
        this.timezoneOffset = this.dateZ.getTimezoneOffset();
        const d = this;

        utils.each(this.members.z, function (name) {
            d[name] = function () {
                return d.dateZ[name]();
            };
        });
        utils.each(this.members['default'], function (name) {
            d[name] = function () {
                return d.date[name]();
            };
        });

    }

    getTimezoneOffset(): number {
        return this.timezoneOffset;
    }

    setTimezoneOffset(offset: number): DateZ {
        this.timezoneOffset = offset;
        this.dateZ = new Date(this.date.getTime() + this.date.getTimezoneOffset() * 60000 - this.timezoneOffset * 60000);
        return this;
    }

    valueOf() {
        return this.date.valueOf();
    }
}

//Day
const d = function (input: Date) {
    return (input.getDate() < 10 ? '0' : '') + input.getDate();
}
const D = function (input: Date) {
    return _days.abbr[input.getDay()];
}

const j = function (input: Date) {
    return input.getDate();
};
const l = function (input: Date) {
    return _days.full[input.getDay()];
};
const N = function (input: Date) {
    let d = input.getDay();
    return (d >= 1) ? d : 7;
};
const S = function (input: Date) {
    let d = input.getDate();
    return (d % 10 === 1 && d !== 11 ? 'st' : (d % 10 === 2 && d !== 12 ? 'nd' : (d % 10 === 3 && d !== 13 ? 'rd' : 'th')));
};
const w = function (input: Date) {
    return input.getDay();
};
const z = function (input: Date, offset: number) {
    let year = input.getFullYear(),
        e = new DateZ(year, input.getMonth(), input.getDate(), 12, 0, 0),
        d = new DateZ(year, 0, 1, 12, 0, 0);

    e.setTimezoneOffset(offset);
    d.setTimezoneOffset(offset);
    return Math.round((e.valueOf() - d.valueOf()) / 86400000);
};

// Week
const W = function (input: Date) {
    var date = new Date(input.valueOf());

    var date2 = new Date(date.getFullYear(), 0, 1);
    var day1 = date.getDay();
    if (day1 == 0) day1 = 7;
    var day2 = date2.getDay();
    if (day2 == 0) day2 = 7;
    var d = Math.round((date.getTime() - date2.getTime() + (day2 - day1) * (24 * 60 * 60 * 1000)) / 86400000);
    return Math.ceil(d / 7) + 1;
};

// Month
const F = function (input: Date) {
    return _months.full[input.getMonth()];
};
const m = function (input: Date) {
    return (input.getMonth() < 9 ? '0' : '') + (input.getMonth() + 1);
};
const M = function (input: Date) {
    return _months.abbr[input.getMonth()];
};
const n = function (input: Date) {
    return input.getMonth() + 1;
};
const t = function (input: Date) {
    return 32 - (new Date(input.getFullYear(), input.getMonth(), 32).getDate());
};

// Year
const L = function (input: Date) {
    return new Date(input.getFullYear(), 1, 29).getDate() === 29;
};
const o = function (input: Date) {
    let target = new Date(input.valueOf());
    target.setDate(target.getDate() - ((input.getDay() + 6) % 7) + 3);
    return target.getFullYear();
};
const Y = function (input: Date) {
    return input.getFullYear();
};
const y = function (input: Date) {
    return (input.getFullYear().toString()).substr(2);
};

// Time
const a = function (input: Date) {
    return input.getHours() < 12 ? 'am' : 'pm';
};
const A = function (input: Date) {
    return input.getHours() < 12 ? 'AM' : 'PM';
};
const B = function (input: Date) {
    let hours = input.getUTCHours(), beats;
    hours = (hours === 23) ? 0 : hours + 1;
    beats = Math.abs(((((hours * 60) + input.getUTCMinutes()) * 60) + input.getUTCSeconds()) / 86.4).toFixed(0);
    return ('000'.concat(beats).slice(beats.length));
};
const g = function (input: Date) {
    let h = input.getHours();
    return h === 0 ? 12 : (h > 12 ? h - 12 : h);
};
const G = function (input: Date) {
    return input.getHours();
};
const h = function (input: Date) {
    let h = input.getHours();
    return ((h < 10 || (12 < h && 22 > h)) ? '0' : '') + ((h < 12) ? h : h - 12);
};
const H = function (input: Date) {
    let h = input.getHours();
    return (h < 10 ? '0' : '') + h;
};
const i = function (input: Date) {
    let m = input.getMinutes();
    return (m < 10 ? '0' : '') + m;
};
const s = function (input: Date) {
    let s = input.getSeconds();
    return (s < 10 ? '0' : '') + s;
};

// Timezone
const O = function (input: Date) {
    let tz = input.getTimezoneOffset();
    return (tz < 0 ? '-' : '+') + (tz / 60 < 10 ? '0' : '') + Math.abs((tz / 60)) + '00';
};
const Z = function (input: Date) {
    return input.getTimezoneOffset() * 60;
};

// Full Date/Time
const c = function (input: Date) {
    return input.toISOString();
};
const r = function (input: Date) {
    return input.toUTCString();
};
const U = function (input: Date) {
    return input.getTime() / 1000;
};

export default {
    DateZ,
    tzOffset,
    d,
    D,
    j,
    l,
    N,
    S,
    w,
    z,
    W,
    F,
    m,
    M,
    n,
    t,
    L,
    o,
    Y,
    y,
    a,
    A,
    B,
    g,
    G,
    h,
    H,
    i,
    s,
    O,
    Z,
    c,
    r,
    U
}
