// ----------------------------------------------------------------------
// Tariff schedule
// ----------------------------------------------------------------------
// A list of periods, each with a start time and a price. A period runs until
// the next one starts, and time before the first period uses the last one.
// One list applies every day. An optional weekend list applies on Saturdays,
// Sundays and listed public holidays.
//
// Periods with the same price form a band, named by the label given to the
// first period at that price. Stored as compact strings, as app config values
// must be flat strings:
//
//   bands     OffPeak:8.5,Peak:28
//   weekday   00:30=OffPeak,05:30=Peak
//   weekend   00:00=OffPeak               (empty: same every day)
//   holidays  2026-12-25,2026-12-26       (dates in local time)
//
// Schedule object used by the editor and rates():
//
//   { weekday: [{ start: "00:30", price: 8.5 }, ...],
//     weekend: null or [...],
//     labels: { "8.5": "OffPeak", "28": "Peak" },
//     holidays: ["2026-12-25"] }
// ----------------------------------------------------------------------
var tariff_schedule = {

    // Cold to hot colour scale for prices, cheapest blue, dearest red
    scale: [[44, 123, 182], [171, 217, 233], [255, 255, 191], [253, 174, 97], [215, 25, 28]],

    // Colour for a price within min..max. A single price uses the middle of the scale.
    price_colour: function(price, min, max) {
        var t = max > min ? (price - min) / (max - min) : 0.5;
        t = Math.min(1, Math.max(0, t)) * (this.scale.length - 1);
        var i = Math.min(Math.floor(t), this.scale.length - 2);
        var f = t - i;
        var a = this.scale[i], b = this.scale[i + 1];
        var rgb = [0, 1, 2].map(function(c) { return Math.round(a[c] + (b[c] - a[c]) * f); });
        return "rgb(" + rgb.join(",") + ")";
    },

    // Example presets for import and export. Prices are examples only.
    presets: {
        // Times checked Oct 2026
        import: {
            "Flat rate":                   { bands: "Standard:25", weekday: "00:00=Standard" },
            "Economy 7 (00:30 to 07:30)":  { bands: "Night:15,Day:30", weekday: "00:30=Night,07:30=Day" },
            "Octopus Go":                  { bands: "OffPeak:8.5,Peak:28", weekday: "00:30=OffPeak,05:30=Peak" },
            "Octopus Intelligent Go":      { bands: "OffPeak:7,Peak:28", weekday: "05:30=Peak,23:30=OffPeak" },
            "Octopus Cosy":                { bands: "Cosy:13,Standard:26,Peak:39", weekday: "00:00=Standard,04:00=Cosy,07:00=Standard,13:00=Cosy,16:00=Peak,19:00=Standard,22:00=Cosy" },
            "British Gas Electric Driver": { bands: "OffPeak:9,Peak:31", weekday: "00:00=OffPeak,05:00=Peak" },
            "EDF GoElectric":              { bands: "OffPeak:6.5,Peak:26", weekday: "06:00=Peak,23:00=OffPeak" },
            "E.ON Next Drive":             { bands: "OffPeak:6.9,Peak:26", weekday: "00:00=OffPeak,06:00=Peak" },
            "E.ON Next Pumped":            { bands: "SuperOffPeak:15,OffPeak:24,Peak:35", weekday: "00:00=SuperOffPeak,06:00=OffPeak,16:00=Peak,19:00=OffPeak,22:00=SuperOffPeak" }
        },
        export: {
            "Flat export":    { bands: "Export:15", weekday: "00:00=Export" }
        }
    },

    // Half hour slots: 0 = 00:00, 1 = 00:30 ... 47 = 23:30
    time_to_slot: function(time) {
        var p = ("" + time).split(":");
        var h = parseInt(p[0], 10); if (isNaN(h) || h < 0) h = 0; if (h > 23) h = 23;
        var m = parseInt(p[1], 10); if (isNaN(m)) m = 0;
        return h * 2 + (m >= 30 ? 1 : 0);
    },

    slot_to_time: function(slot) {
        slot = ((slot % 48) + 48) % 48;
        var h = Math.floor(slot / 2);
        return (h < 10 ? "0" : "") + h + ":" + (slot % 2 ? "30" : "00");
    },

    // Local date key YYYY-MM-DD
    date_key: function(d) {
        var m = d.getMonth() + 1, day = d.getDate();
        return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
    },

    // Labels are keyed by price, so 8.5 and 8.50 share a label
    price_key: function(price) {
        return String(parseFloat(price) || 0);
    },

    // Labels must not contain the separators used by the stored format
    clean_label: function(label) {
        return ("" + (label || "")).replace(/[:,=]/g, "").trim();
    },

    // Schedule object from stored strings. A weekend list that matches the
    // weekday list is treated as the same every day.
    parse: function(bands, weekday, weekend, holidays) {
        var self = this;
        var price = {};
        var labels = {};
        var first = null;
        ("" + (bands || "")).split(",").forEach(function(item) {
            var i = item.lastIndexOf(":");
            if (i < 1) return;
            var name = item.slice(0, i).trim();
            var p = parseFloat(item.slice(i + 1)) || 0;
            price[name] = p;
            if (first === null) first = p;
            var key = self.price_key(p);
            if (labels[key] === undefined) labels[key] = name;
        });

        var parse_periods = function(value) {
            var periods = [];
            ("" + (value || "")).split(",").forEach(function(item) {
                var i = item.indexOf("=");
                if (i < 1) return;
                var name = item.slice(i + 1).trim();
                periods.push({ start: item.slice(0, i), price: price[name] !== undefined ? price[name] : (first || 0) });
            });
            return periods;
        };

        var schedule = this.clean({
            weekday: parse_periods(weekday),
            weekend: weekend ? parse_periods(weekend) : null,
            labels: labels,
            holidays: ("" + (holidays || "")).split(",")
        });
        if (schedule.weekend && JSON.stringify(schedule.weekend) === JSON.stringify(schedule.weekday)) {
            schedule.weekend = null;
        }
        return schedule;
    },

    // Distinct prices in order of first use, weekday list first
    prices: function(schedule) {
        var self = this;
        var keys = [];
        schedule.weekday.concat(schedule.weekend || []).forEach(function(p) {
            var key = self.price_key(p.price);
            if (keys.indexOf(key) === -1) keys.push(key);
        });
        return keys;
    },

    // Band name for each price: its label, else the price, made unique
    band_names: function(schedule) {
        var self = this;
        var names = {};
        var used = {};
        this.prices(schedule).forEach(function(key) {
            var base = self.clean_label(schedule.labels[key]) || key + "p";
            var name = base, n = 2;
            while (used[name]) name = base + " " + (n++);
            used[name] = true;
            names[key] = name;
        });
        return names;
    },

    serialise: function(schedule) {
        var self = this;
        var names = this.band_names(schedule);
        var periods = function(list) {
            return list.map(function(p) { return p.start + "=" + names[self.price_key(p.price)]; }).join(",");
        };
        return {
            bands: this.prices(schedule).map(function(key) { return names[key] + ":" + key; }).join(","),
            weekday: periods(schedule.weekday),
            weekend: schedule.weekend ? periods(schedule.weekend) : "",
            holidays: schedule.weekend ? schedule.holidays.join(",") : ""
        };
    },

    // Periods sorted with one per slot and at least one period, numeric
    // prices, and valid unique holiday dates.
    clean: function(schedule) {
        var self = this;
        var clean_periods = function(periods) {
            var by_slot = {};
            periods.forEach(function(p) { by_slot[self.time_to_slot(p.start)] = parseFloat(p.price) || 0; });
            var out = Object.keys(by_slot).map(Number).sort(function(a, b) { return a - b; }).map(function(slot) {
                return { start: self.slot_to_time(slot), price: by_slot[slot] };
            });
            if (!out.length) out.push({ start: "00:00", price: 0 });
            return out;
        };

        var labels = {};
        for (var key in (schedule.labels || {})) {
            var label = this.clean_label(schedule.labels[key]);
            if (label) labels[this.price_key(key)] = label;
        }

        var holidays = (schedule.holidays || []).map(function(d) { return ("" + d).trim(); })
            .filter(function(d, i, all) { return /^\d{4}-\d{2}-\d{2}$/.test(d) && all.indexOf(d) === i; })
            .sort();

        return {
            weekday: clean_periods(schedule.weekday),
            weekend: schedule.weekend ? clean_periods(schedule.weekend) : null,
            labels: labels,
            holidays: holidays
        };
    },

    // Price for each of the 48 slots of a day
    slot_prices: function(periods) {
        var self = this;
        var sorted = periods.slice().sort(function(a, b) { return self.time_to_slot(a.start) - self.time_to_slot(b.start); });
        var prices = new Array(48).fill(sorted.length ? sorted[sorted.length - 1].price : null);
        sorted.forEach(function(p) {
            for (var s = self.time_to_slot(p.start); s < 48; s++) prices[s] = p.price;
        });
        return prices;
    },

    // Price for each half hour from ts to te inclusive (ms), in browser local time
    rates: function(schedule, ts, te, interval) {
        var self = this;
        var weekday = this.slot_prices(schedule.weekday);
        var weekend = schedule.weekend ? this.slot_prices(schedule.weekend) : weekday;
        var holidays = {};
        (schedule.holidays || []).forEach(function(d) { holidays[d] = true; });

        var data = [];
        var d = new Date();
        for (var time = ts; time <= te; time += interval) {
            d.setTime(time);
            var slot = d.getHours() * 2 + (d.getMinutes() >= 30 ? 1 : 0);
            var day = d.getDay();
            var is_weekend = day === 0 || day === 6 || holidays[self.date_key(d)] === true;
            data.push([time, (is_weekend ? weekend : weekday)[slot]]);
        }
        return data;
    }
};

// ----------------------------------------------------------------------
// Schedule editor (Vue component)
// ----------------------------------------------------------------------
// Props:
//   schedule  schedule object, edited in place
//   editing   show edit controls
//   unit      price unit label, e.g. p/kWh
// ----------------------------------------------------------------------
tariff_schedule.component = {
    props: ["schedule", "editing", "unit"],
    data: function() {
        tariff_schedule.count = (tariff_schedule.count || 0) + 1;
        return { tab: "weekday", new_holiday: "", uid: "sched-weekend-" + tariff_schedule.count };
    },
    computed: {
        time_options: function() {
            var opts = [];
            for (var s = 0; s < 48; s++) opts.push(tariff_schedule.slot_to_time(s));
            return opts;
        },
        has_weekend: function() {
            return !!this.schedule.weekend;
        },
        // Periods shown, weekday when there is no weekend list
        periods: function() {
            return (this.tab === "weekend" && this.schedule.weekend) ? this.schedule.weekend : this.schedule.weekday;
        },
        // Lowest and highest price across both lists, for the colour scale
        price_range: function() {
            var prices = tariff_schedule.prices(this.schedule).map(Number);
            return { min: Math.min.apply(null, prices), max: Math.max.apply(null, prices) };
        },
        // Index of the first period at each price across both lists
        first_index: function() {
            var first = {};
            var tab_offset = this.tab === "weekend" ? this.schedule.weekday.length : 0;
            this.schedule.weekday.concat(this.schedule.weekend || []).forEach(function(p, i) {
                var key = tariff_schedule.price_key(p.price);
                if (first[key] === undefined) first[key] = i - tab_offset;
            });
            return first;
        },
        hours: function() {
            return ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];
        },
        cells: function() {
            var self = this;
            return tariff_schedule.slot_prices(this.periods).map(function(price, s) {
                return { colour: self.colour(price), title: tariff_schedule.slot_to_time(s) + " " + self.label(price) + " " + price + " " + self.unit };
            });
        }
    },
    watch: {
        has_weekend: function(on) { if (!on) this.tab = "weekday"; }
    },
    methods: {
        key: function(price) {
            return tariff_schedule.price_key(price);
        },
        colour: function(price) {
            return tariff_schedule.price_colour(parseFloat(price) || 0, this.price_range.min, this.price_range.max);
        },
        label: function(price) {
            return this.schedule.labels[this.key(price)] || "";
        },
        // Only the first period at a price sets the label
        is_first: function(i) {
            return this.first_index[this.key(this.periods[i].price)] === i;
        },
        set_label: function(price, value) {
            this.schedule.labels[this.key(price)] = tariff_schedule.clean_label(value);
        },
        // A label moves with its price when no other period uses the old price
        set_price: function(i, value) {
            var period = this.periods[i];
            var old_key = this.key(period.price);
            var new_key = this.key(value);
            period.price = parseFloat(value) || 0;
            var labels = this.schedule.labels;
            var still_used = this.schedule.weekday.concat(this.schedule.weekend || []).some(function(p) {
                return tariff_schedule.price_key(p.price) === old_key;
            });
            if (labels[old_key] && !still_used && !labels[new_key]) {
                labels[new_key] = labels[old_key];
                delete labels[old_key];
            }
        },
        until: function(i) {
            if (this.periods.length < 2) return "All day";
            return this.periods[(i + 1) % this.periods.length].start;
        },
        format_date: function(key) {
            var p = key.split("-");
            return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
        },
        sort_periods: function() {
            this.periods.sort(function(a, b) {
                return tariff_schedule.time_to_slot(a.start) - tariff_schedule.time_to_slot(b.start);
            });
        },
        add_period: function() {
            var used = this.periods.map(function(p) { return tariff_schedule.time_to_slot(p.start); });
            var slot = 0;
            while (slot < 47 && used.indexOf(slot) !== -1) slot++;
            var last = this.periods[this.periods.length - 1];
            this.periods.push({ start: tariff_schedule.slot_to_time(slot), price: last ? last.price : 0 });
            this.sort_periods();
        },
        del_period: function(i) {
            if (this.periods.length > 1) this.periods.splice(i, 1);
        },
        // Weekend list starts as a copy of the weekday list
        set_weekend: function(on) {
            this.schedule.weekend = on ? this.schedule.weekday.map(function(p) { return { start: p.start, price: p.price }; }) : null;
            if (on) this.tab = "weekend";
        },
        add_holiday: function() {
            var d = this.new_holiday;
            if (d && this.schedule.holidays.indexOf(d) === -1) {
                this.schedule.holidays.push(d);
                this.schedule.holidays.sort();
            }
            this.new_holiday = "";
        },
        del_holiday: function(i) {
            this.schedule.holidays.splice(i, 1);
        }
    },
    template: `
<div class="sched-panel">
  <div class="sched-panel-head">
    <span class="sched-subhead">Schedule</span>
    <span class="small text-body-secondary" v-if="!has_weekend">Every day</span>
    <div class="btn-group app-segmented" v-else>
      <button type="button" class="btn" :class="{active: tab == 'weekday'}" @click="tab = 'weekday'">Weekday</button>
      <button type="button" class="btn" :class="{active: tab == 'weekend'}" @click="tab = 'weekend'">Weekend &amp; holidays</button>
    </div>
  </div>

  <div class="sched-hours"><span v-for="h in hours" :key="h">{{ h }}</span></div>
  <div class="sched-strip">
    <span v-for="(c, s) in cells" :key="s" :title="c.title" :style="{background: c.colour}"></span>
  </div>

  <table class="table table-sm align-middle sched-table">
    <thead>
      <tr>
        <th class="sched-swatch-col"></th>
        <th>Label</th>
        <th>Time</th>
        <th class="text-end">Price</th>
        <th class="text-end" v-if="editing"><button type="button" class="btn btn-link p-0" title="Add a period" @click="add_period"><span class="svg-icon-plus"></span></button></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(p, i) in periods" :key="tab + i">
        <td class="sched-swatch-col"><span class="app-swatch" :style="{background: colour(p.price)}"></span></td>
        <template v-if="editing">
          <td><input type="text" class="form-control form-control-sm sched-name" :value="label(p.price)" :disabled="!is_first(i)"
            :placeholder="is_first(i) ? 'Optional' : ''" :title="is_first(i) ? '' : 'Set by the first period at this price'" @change="set_label(p.price, $event.target.value)"></td>
          <td><div class="d-flex align-items-center gap-2">
            <select class="form-select form-select-sm sched-time" v-model="p.start" @change="sort_periods">
              <option v-for="t in time_options" :key="t" :value="t">{{ t }}</option></select>
            <span class="text-body-secondary text-nowrap">&rarr; {{ until(i) }}</span></div></td>
          <td><div class="d-flex align-items-center justify-content-end gap-2">
            <input type="number" step="0.01" class="form-control form-control-sm text-end sched-num" :value="p.price" @change="set_price(i, $event.target.value)">
            <span class="text-body-secondary small">{{ unit }}</span></div></td>
          <td class="text-end"><button type="button" class="btn btn-link p-0 sched-del" title="Remove period" @click="del_period(i)"><span class="svg-icon-close"></span></button></td>
        </template>
        <template v-else>
          <td>{{ label(p.price) }}</td>
          <td class="text-nowrap">{{ p.start }} <span class="text-body-secondary">&rarr; {{ until(i) }}</span></td>
          <td class="text-end text-nowrap">{{ p.price }} <span class="text-body-secondary small">{{ unit }}</span></td>
        </template>
      </tr>
    </tbody>
  </table>

  <div v-if="tab == 'weekend' && has_weekend">
    <div class="small text-body-secondary mb-1">Public holidays</div>
    <div class="d-flex flex-wrap gap-2 mb-2">
      <span class="badge text-bg-secondary sched-holiday" v-for="(d, i) in schedule.holidays" :key="d">{{ format_date(d) }}
        <button type="button" class="btn btn-link p-0 ms-1 sched-del" v-if="editing" title="Remove date" @click="del_holiday(i)"><span class="svg-icon-close"></span></button></span>
      <span class="small text-body-secondary" v-if="!schedule.holidays.length">None</span>
    </div>
    <div class="input-group input-group-sm w-auto" v-if="editing">
      <input type="date" class="form-control" v-model="new_holiday">
      <button type="button" class="btn btn-outline-secondary" @click="add_holiday">Add date</button>
    </div>
  </div>

  <div class="form-check mt-2" v-if="editing">
    <input class="form-check-input" type="checkbox" :id="uid" :checked="has_weekend" @change="set_weekend($event.target.checked)">
    <label class="form-check-label small" :for="uid">Different schedule at weekends and on public holidays</label>
  </div>
</div>`
};
