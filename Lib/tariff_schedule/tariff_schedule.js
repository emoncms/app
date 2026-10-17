// ----------------------------------------------------------------------
// Tariff schedule
// ----------------------------------------------------------------------
// Named bands with prices, and blocks that set the band from a start time.
// One set of blocks applies every day. An optional weekend set applies on
// Saturdays, Sundays and listed public holidays. Stored as compact strings,
// as app config values must be flat strings:
//
//   bands     OffPeak:8.5,Peak:28
//   weekday   00:30=OffPeak,05:30=Peak
//   weekend   00:00=OffPeak               (empty: same every day)
//   holidays  2026-12-25,2026-12-26       (dates in local time)
//
// Time before the first block uses the last block of the day.
// ----------------------------------------------------------------------
var tariff_schedule = {

    colours: ["#44b3e2", "#fb1a80", "#ffb000", "#29af29", "#941afb", "#888888"],

    // Example presets. Prices are examples only.
    presets: {
        "Flat rate":      { bands: "Standard:25", weekday: "00:00=Standard" },
        "Octopus Go":     { bands: "OffPeak:8.5,Peak:28", weekday: "00:30=OffPeak,05:30=Peak" },
        "Intelligent Go": { bands: "OffPeak:7,Peak:28", weekday: "05:30=Peak,23:30=OffPeak" },
        "Cosy":           { bands: "Cosy:13,Standard:26,Peak:39", weekday: "00:00=Standard,04:00=Cosy,07:00=Standard,13:00=Cosy,16:00=Peak,19:00=Standard,22:00=Cosy" },
        "Flat export":    { bands: "Export:15", weekday: "00:00=Export" }
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

    // Band names must not contain the separators used by the stored format
    clean_name: function(name) {
        return ("" + name).replace(/[:,=]/g, "").trim();
    },

    parse_bands: function(value) {
        var bands = [];
        ("" + (value || "")).split(",").forEach(function(item) {
            var i = item.lastIndexOf(":");
            if (i < 1) return;
            bands.push({ name: item.slice(0, i).trim(), price: parseFloat(item.slice(i + 1)) || 0 });
        });
        return bands;
    },

    parse_blocks: function(value) {
        var self = this;
        var blocks = [];
        ("" + (value || "")).split(",").forEach(function(item) {
            var i = item.indexOf("=");
            if (i < 1) return;
            blocks.push({ start: self.slot_to_time(self.time_to_slot(item.slice(0, i))), name: item.slice(i + 1).trim() });
        });
        return blocks;
    },

    serialise_bands: function(bands) {
        return bands.map(function(b) { return b.name + ":" + b.price; }).join(",");
    },

    serialise_blocks: function(blocks) {
        return blocks.map(function(b) { return b.start + "=" + b.name; }).join(",");
    },

    // Schedule object from stored strings. A weekend set that matches the
    // weekday set is treated as the same every day.
    parse: function(bands, weekday, weekend, holidays) {
        var schedule = this.clean({
            bands: this.parse_bands(bands),
            weekday: this.parse_blocks(weekday),
            weekend: weekend ? this.parse_blocks(weekend) : null,
            holidays: ("" + (holidays || "")).split(",")
        });
        if (schedule.weekend && this.serialise_blocks(schedule.weekend) === this.serialise_blocks(schedule.weekday)) {
            schedule.weekend = null;
        }
        return schedule;
    },

    serialise: function(schedule) {
        return {
            bands: this.serialise_bands(schedule.bands),
            weekday: this.serialise_blocks(schedule.weekday),
            weekend: schedule.weekend ? this.serialise_blocks(schedule.weekend) : "",
            holidays: schedule.weekend ? schedule.holidays.join(",") : ""
        };
    },

    // Unique non-empty band names, blocks sorted with one block per slot and
    // referencing a defined band, at least one band and block, and valid
    // unique holiday dates.
    clean: function(schedule) {
        var self = this;
        var seen = {};
        var bands = [];
        schedule.bands.forEach(function(b) {
            var name = self.clean_name(b.name);
            if (!name || seen[name]) return;
            seen[name] = true;
            bands.push({ name: name, price: parseFloat(b.price) || 0 });
        });
        if (!bands.length) bands.push({ name: "Standard", price: 0 });

        var clean_blocks = function(blocks) {
            var by_slot = {};
            blocks.forEach(function(b) {
                var name = self.clean_name(b.name);
                by_slot[self.time_to_slot(b.start)] = seen[name] ? name : bands[0].name;
            });
            var out = Object.keys(by_slot).map(Number).sort(function(a, b) { return a - b; }).map(function(slot) {
                return { start: self.slot_to_time(slot), name: by_slot[slot] };
            });
            if (!out.length) out.push({ start: "00:00", name: bands[0].name });
            return out;
        };

        var holidays = (schedule.holidays || []).map(function(d) { return ("" + d).trim(); })
            .filter(function(d, i, all) { return /^\d{4}-\d{2}-\d{2}$/.test(d) && all.indexOf(d) === i; })
            .sort();

        return {
            bands: bands,
            weekday: clean_blocks(schedule.weekday),
            weekend: schedule.weekend ? clean_blocks(schedule.weekend) : null,
            holidays: holidays
        };
    },

    // Band name for each of the 48 slots of a day
    slot_bands: function(blocks) {
        var self = this;
        var sorted = blocks.slice().sort(function(a, b) { return self.time_to_slot(a.start) - self.time_to_slot(b.start); });
        var names = new Array(48).fill(sorted.length ? sorted[sorted.length - 1].name : "");
        sorted.forEach(function(b) {
            for (var s = self.time_to_slot(b.start); s < 48; s++) names[s] = b.name;
        });
        return names;
    },

    // Price for each half hour from ts to te inclusive (ms), in browser local time
    rates: function(schedule, ts, te, interval) {
        var self = this;
        var price = {};
        schedule.bands.forEach(function(b) { price[b.name] = b.price; });
        var weekday = this.slot_bands(schedule.weekday).map(function(n) { return price[n]; });
        var weekend = schedule.weekend ? this.slot_bands(schedule.weekend).map(function(n) { return price[n]; }) : weekday;
        var holidays = {};
        (schedule.holidays || []).forEach(function(d) { holidays[d] = true; });

        var data = [];
        var d = new Date();
        for (var time = ts; time <= te; time += interval) {
            d.setTime(time);
            var slot = d.getHours() * 2 + (d.getMinutes() >= 30 ? 1 : 0);
            var day = d.getDay();
            var is_weekend = day === 0 || day === 6 || holidays[self.date_key(d)] === true;
            var rate = is_weekend ? weekend[slot] : weekday[slot];
            data.push([time, rate === undefined ? null : rate]);
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
        return { tab: "weekday", message: "", new_holiday: "", uid: "sched-weekend-" + tariff_schedule.count };
    },
    computed: {
        time_options: function() {
            var opts = [];
            for (var s = 0; s < 48; s++) opts.push(tariff_schedule.slot_to_time(s));
            return opts;
        },
        band_names: function() {
            return this.schedule.bands.map(function(b) { return b.name; });
        },
        // Blocks shown, weekday when there is no weekend set
        blocks: function() {
            return (this.tab === "weekend" && this.schedule.weekend) ? this.schedule.weekend : this.schedule.weekday;
        },
        has_weekend: function() {
            return !!this.schedule.weekend;
        }
    },
    watch: {
        has_weekend: function(on) { if (!on) this.tab = "weekday"; }
    },
    methods: {
        price: function(name) {
            var band = this.schedule.bands.find(function(b) { return b.name === name; });
            return band ? band.price : "";
        },
        // End of a block: start of the next block, wrapping to the first
        until: function(i) {
            if (this.blocks.length < 2) return "All day";
            return this.blocks[(i + 1) % this.blocks.length].start;
        },
        colour: function(name) {
            var i = this.band_names.indexOf(name);
            return tariff_schedule.colours[Math.max(0, i) % tariff_schedule.colours.length];
        },
        format_date: function(key) {
            var p = key.split("-");
            return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
        },
        all_blocks: function() {
            return this.schedule.weekday.concat(this.schedule.weekend || []);
        },
        unique_name: function(base, ignore) {
            var names = this.band_names.filter(function(n, i) { return i !== ignore; });
            var name = base, n = 2;
            while (names.indexOf(name) !== -1) name = base + " " + (n++);
            return name;
        },
        add_band: function() {
            this.schedule.bands.push({ name: this.unique_name("Band", -1), price: 0 });
        },
        del_band: function(i) {
            var name = this.schedule.bands[i].name;
            if (this.all_blocks().some(function(b) { return b.name === name; })) {
                this.flash("\"" + name + "\" is used in the schedule. Remove those blocks first.");
                return;
            }
            if (this.schedule.bands.length > 1) this.schedule.bands.splice(i, 1);
        },
        rename_band: function(i, raw) {
            var old_name = this.schedule.bands[i].name;
            var new_name = this.unique_name(tariff_schedule.clean_name(raw) || "Band", i);
            this.all_blocks().forEach(function(b) {
                if (b.name === old_name) b.name = new_name;
            });
            this.schedule.bands[i].name = new_name;
        },
        sort_blocks: function() {
            this.blocks.sort(function(a, b) {
                return tariff_schedule.time_to_slot(a.start) - tariff_schedule.time_to_slot(b.start);
            });
        },
        add_block: function() {
            var used = this.blocks.map(function(b) { return tariff_schedule.time_to_slot(b.start); });
            var slot = 0;
            while (slot < 47 && used.indexOf(slot) !== -1) slot++;
            var name = this.blocks.length ? this.blocks[this.blocks.length - 1].name : this.band_names[0];
            this.blocks.push({ start: tariff_schedule.slot_to_time(slot), name: name });
            this.sort_blocks();
        },
        del_block: function(i) {
            if (this.blocks.length > 1) this.blocks.splice(i, 1);
        },
        // Weekend set starts as a copy of the weekday set
        set_weekend: function(on) {
            this.schedule.weekend = on ? this.schedule.weekday.map(function(b) { return { start: b.start, name: b.name }; }) : null;
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
        },
        flash: function(text) {
            var self = this;
            this.message = text;
            setTimeout(function() { self.message = ""; }, 4000);
        }
    },
    template: `
<div class="row g-3">
  <div class="col-md-5" v-if="editing">
   <div class="sched-panel">
    <div class="sched-panel-head">
      <span class="sched-subhead">Bands</span>
    </div>
    <table class="table table-sm align-middle sched-table">
      <thead>
        <tr>
          <th>Band</th>
          <th>Price ({{ unit }})</th>
          <th class="text-end"><button type="button" class="btn btn-link p-0" title="Add a band" @click="add_band"><span class="svg-icon-plus"></span></button></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(b, i) in schedule.bands" :key="i">
          <td><div class="d-flex align-items-center"><span class="app-swatch" :style="{background: colour(b.name)}"></span>
            <input type="text" class="form-control form-control-sm sched-name" :value="b.name" @change="rename_band(i, $event.target.value)"></div></td>
          <td><input type="number" step="0.01" class="form-control form-control-sm text-end sched-num" v-model.number="b.price"></td>
          <td class="text-end"><button type="button" class="btn btn-link p-0 sched-del" title="Remove band" @click="del_band(i)"><span class="svg-icon-close"></span></button></td>
        </tr>
      </tbody>
    </table>
    <div class="small text-warning" v-if="message">{{ message }}</div>
   </div>
  </div>
  <div :class="editing ? 'col-md-7' : 'col-12'">
   <div class="sched-panel">
    <div class="sched-panel-head">
      <span class="sched-subhead">Schedule</span>
      <span class="small text-body-secondary" v-if="!has_weekend">Every day</span>
      <div class="btn-group app-segmented" v-else>
        <button type="button" class="btn" :class="{active: tab == 'weekday'}" @click="tab = 'weekday'">Weekday</button>
        <button type="button" class="btn" :class="{active: tab == 'weekend'}" @click="tab = 'weekend'">Weekend &amp; holidays</button>
      </div>
    </div>
    <table class="table table-sm align-middle sched-table">
      <thead>
        <tr>
          <th>From</th>
          <th v-if="!editing">Until</th>
          <th>Band</th>
          <th class="text-end">Price ({{ unit }})</th>
          <th class="text-end" v-if="editing"><button type="button" class="btn btn-link p-0" title="Add a time block" @click="add_block"><span class="svg-icon-plus"></span></button></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(b, i) in blocks" :key="tab + i">
          <template v-if="editing">
            <td><select class="form-select form-select-sm sched-num" v-model="b.start" @change="sort_blocks">
              <option v-for="t in time_options" :key="t" :value="t">{{ t }}</option></select></td>
            <td><div class="d-flex align-items-center"><span class="app-swatch" :style="{background: colour(b.name)}"></span>
              <select class="form-select form-select-sm sched-name" v-model="b.name">
                <option v-for="n in band_names" :key="n" :value="n">{{ n }}</option></select></div></td>
            <td class="text-end text-body-secondary">{{ price(b.name) }}</td>
            <td class="text-end"><button type="button" class="btn btn-link p-0 sched-del" title="Remove block" @click="del_block(i)"><span class="svg-icon-close"></span></button></td>
          </template>
          <template v-else>
            <td>{{ b.start }}</td>
            <td>{{ until(i) }}</td>
            <td><span class="app-swatch" :style="{background: colour(b.name)}"></span>{{ b.name }}</td>
            <td class="text-end">{{ price(b.name) }}</td>
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
   </div>
  </div>
</div>`
};
