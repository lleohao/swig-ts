import { each } from './utils';

const _months = {
    full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    abbr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};
const _days = {
    full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    abbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    alt: { '-1': 'Yesterday', 0: 'Today', 1: 'Tomorrow' }
}

export const tzOffset = 0;
export class DateZ implements DateZ {
    private date: Date;
    private dateZ: Date;
    private timezoneOffset: number;

    constructor(...argument: number[]) {
        const members = {
            'default': ['getUTCDate', 'getUTCDay', 'getUTCFullYear', 'getUTCHours', 'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds', 'toISOString', 'toGMTString', 'toUTCString', 'valueOf', 'getTime'],
            z: ['getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds', 'getYear', 'toDateString', 'toLocaleDateString', 'toLocaleTimeString']
        };

        this.date = this.dateZ = (argument.length > 1) ? new Date(Date.UTC.apply(Date, argument) + (new Date().getTimezoneOffset() * 60 * 1000)) : (argument.length === 1) ? new Date(new Date(argument[0])) : new Date();
        this.timezoneOffset = this.dateZ.getTimezoneOffset();

        each(members.z, (name: string) => {
            (this as any)[name] = function () {
                return (this.dateZ as any)[name]();
            }
        });

        /**
         * Default get UTC time
         */
        each(members['default'], (name: string) => {
            (this as any)[name] = function () {
                return (this.date as any)[name]();
            };
        });

        this.setTimezoneOffset(tzOffset);
    }

    getTimezoneOffset() {
        return this.timezoneOffset;
    }

    setTimezoneOffset(offset: number) {
        this.timezoneOffset = offset;
        this.dateZ = new Date(this.date.getTime() + this.date.getTimezoneOffset() * 60000 - this.timezoneOffset * 60000);
        return this;
    }
}

// Day
export const d = (input: Date) => {
    return (input.getDate() < 10 ? '0' : '') + input.getDate();
}
export const D = (input: Date) => {
    return _days.abbr[input.getDay()];
}
export const j = (input: Date) => {
    return input.getDate();
}
export const l = (input: Date) => {
    return _days.full[input.getDay()];
};
export const N = (input: Date) => {
    var d = input.getDay();
    return (d >= 1) ? d : 7;
};
export const S = (input: Date) => {
    var d = input.getDate();
    return (d % 10 === 1 && d !== 11 ? 'st' : (d % 10 === 2 && d !== 12 ? 'nd' : (d % 10 === 3 && d !== 13 ? 'rd' : 'th')));
};
export const w = (input: Date) => {
    return input.getDay();
};

// FIXME: Invalid parameter exists 
// export const z = (input: Date, offset: number) => {
//     var year = input.getFullYear(),
//         e = new DateZ(year, input.getMonth(), input.getDate(), 12, 0, 0),
//         d = new DateZ(year, 0, 1, 12, 0, 0);

//     e.setTimezoneOffset(offset);
//     d.setTimezoneOffset(offset);
//     return Math.round((e.getTimezoneOffset() - d.getTimezoneOffset()) / 86400000);
// };

// Month
exports.F = (input: Date) => {
    return _months.full[input.getMonth()];
};
exports.m = (input: Date) => {
    return (input.getMonth() < 9 ? '0' : '') + (input.getMonth() + 1);
};
exports.M = (input: Date) => {
    return _months.abbr[input.getMonth()];
};
exports.n = (input: Date) => {
    return input.getMonth() + 1;
};
exports.t = (input: Date) => {
    return 32 - (new Date(input.getFullYear(), input.getMonth(), 32).getDate());
};

// Year
exports.L = (input: Date) => {
    return new Date(input.getFullYear(), 1, 29).getDate() === 29;
};
exports.o = (input: Date) => {
    var target = new Date(input.valueOf());
    target.setDate(target.getDate() - ((input.getDay() + 6) % 7) + 3);
    return target.getFullYear();
};
exports.Y = (input: Date) => {
    return input.getFullYear();
};
exports.y = (input: Date) => {
    return (input.getFullYear().toString()).substr(2);
};

// Time
exports.a = (input: Date) => {
    return input.getHours() < 12 ? 'am' : 'pm';
};
exports.A = (input: Date) => {
    return input.getHours() < 12 ? 'AM' : 'PM';
};
exports.B = (input: Date) => {
    var hours = input.getUTCHours(), beats;
    hours = (hours === 23) ? 0 : hours + 1;
    beats = Math.abs(((((hours * 60) + input.getUTCMinutes()) * 60) + input.getUTCSeconds()) / 86.4).toFixed(0);
    return ('000'.concat(beats).slice(beats.length));
};
exports.g = (input: Date) => {
    var h = input.getHours();
    return h === 0 ? 12 : (h > 12 ? h - 12 : h);
};
exports.G = (input: Date) => {
    return input.getHours();
};
exports.h = (input: Date) => {
    var h = input.getHours();
    return ((h < 10 || (12 < h && 22 > h)) ? '0' : '') + ((h < 12) ? h : h - 12);
};
exports.H = (input: Date) => {
    var h = input.getHours();
    return (h < 10 ? '0' : '') + h;
};
exports.i = (input: Date) => {
    var m = input.getMinutes();
    return (m < 10 ? '0' : '') + m;
};
exports.s = (input: Date) => {
    var s = input.getSeconds();
    return (s < 10 ? '0' : '') + s;
};

// Timezone
exports.O = (input: Date) => {
    var tz = input.getTimezoneOffset();
    return (tz < 0 ? '-' : '+') + (tz / 60 < 10 ? '0' : '') + Math.abs((tz / 60)) + '00';
};
exports.Z = (input: Date) => {
    return input.getTimezoneOffset() * 60;
};

// Full Date/Time
exports.c = (input: Date) => {
    return input.toISOString();
};
exports.r = (input: Date) => {
    return input.toUTCString();
};
exports.U = (input: Date) => {
    return input.getTime() / 1000;
};