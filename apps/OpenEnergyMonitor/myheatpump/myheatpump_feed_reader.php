<?php

// Feed data for the daily processor, read straight from PHPFina files where it
// can, otherwise through $feed->get_data.
//
// get_day() returns what $feed->get_data($id, $start, $end, $interval, 1,
// $timezone, "notime") returns, value for value, as PHPFina::get_data_combined
// works it out:
//   - feed interval >= request interval: the value at the start of each
//     slot, if the slot starts within the feed (no averaging)
//   - feed interval < request interval: the mean of the non-NaN values in
//     each slot
//   - NaN is null
// The redis buffer is not merged for averaged requests, so it plays no part.
//
// The engine, the meta data and an open file handle are kept per feed, so a run
// over many days reads each file once a day without the per call lookups.
// Anything other than a readable PHPFina feed goes to $feed->get_data.

class MyHeatPumpFeedReader {

    private $feed;
    private $dir;
    private $feeds = array();

    public function __construct($feed, $phpfina_dir = null) {
        $this->feed = $feed;
        if ($phpfina_dir === null) {
            global $settings;
            if (isset($settings['feed']['phpfina']['datadir'])) {
                $phpfina_dir = $settings['feed']['phpfina']['datadir'];
            }
        }
        $this->dir = $phpfina_dir;
    }

    public function get_day($feedid, $start, $end, $interval, $timezone) {
        $feedid = (int) $feedid;
        $f = $this->open($feedid);
        if ($f === false || !is_int($start) || !is_int($end) || !is_int($interval) || $interval < 1 || $end <= $start) {
            return $this->feed->get_data($feedid, $start, $end, $interval, 1, $timezone, "notime");
        }

        // Points in the file now: it grows as data comes in
        $stat = fstat($f['fh']);
        $npoints = (int) floor($stat['size'] / 4.0);
        if ($npoints == 0) {
            return $this->feed->get_data($feedid, $start, $end, $interval, 1, $timezone, "notime");
        }
        $fi = $f['interval'];
        $fs = $f['start_time'];
        $fe = $fs + $fi * ($npoints - 1);

        $count = intdiv($end - $start, $interval) + 1;

        if ($interval <= $fi) {
            return $this->read_samples($f['fh'], $fi, $fs, $fe, $start, $interval, $count);
        } else {
            return $this->read_averages($f['fh'], $fi, $fs, $npoints, $start, $interval, $count);
        }
    }

    public function close() {
        foreach ($this->feeds as $f) {
            if ($f !== false) fclose($f['fh']);
        }
        $this->feeds = array();
    }

    // The value at the start of each slot, for slots that start within the feed
    private function read_samples($fh, $fi, $fs, $fe, $start, $interval, $count) {
        $out = array_fill(0, $count, null);

        // First and last slot within the feed
        $k0 = $start >= $fs ? 0 : intdiv($fs - $start + $interval - 1, $interval);
        $k1 = $count - 1;
        $last = $start + $k1 * $interval;
        if ($last > $fe) {
            if ($fe < $start) return $out;
            $k1 = intdiv($fe - $start, $interval);
        }
        if ($k0 > $k1) return $out;

        $p0 = intdiv($start + $k0 * $interval - $fs, $fi);
        $p1 = intdiv($start + $k1 * $interval - $fs, $fi);
        fseek($fh, $p0 * 4);
        $raw = fread($fh, ($p1 - $p0 + 1) * 4);
        $native = unpack("f*", $raw);       // 1 based

        if ($fi == $interval) {
            // One value per slot, in order. A whole request with no NaN (a NaN
            // makes the sum NaN, worked out in C) is the file's values as they are
            if ($k0 == 0 && $k1 == $count - 1 && !is_nan(array_sum($native))) {
                return array_values($native);
            }
            $j = 1;
            for ($k = $k0; $k <= $k1; $k++) {
                $v = $native[$j++];
                if ($v == $v) $out[$k] = $v;   // NaN != NaN
            }
        } else {
            for ($k = $k0; $k <= $k1; $k++) {
                $v = $native[intdiv($start + $k * $interval - $fs, $fi) - $p0 + 1];
                if ($v == $v) $out[$k] = $v;
            }
        }
        return $out;
    }

    // The mean of the non-NaN values in each slot, added in file order as the engine does
    private function read_averages($fh, $fi, $fs, $npoints, $start, $interval, $count) {
        $out = array_fill(0, $count, null);

        $first = $this->clamp_pos(floor(($start - $fs) / $fi), $npoints);
        $final = $this->clamp_pos(floor(($start + $count * $interval - $fs) / $fi), $npoints);
        if ($final <= $first) return $out;

        fseek($fh, $first * 4);
        $native = unpack("f*", fread($fh, ($final - $first) * 4));

        for ($k = 0; $k < $count; $k++) {
            $t = $start + $k * $interval;
            $ps = $this->clamp_pos(floor(($t - $fs) / $fi), $npoints);
            $pe = $this->clamp_pos(floor(($t + $interval - $fs) / $fi), $npoints);
            $sum = 0;
            $n = 0;
            for ($p = $ps; $p < $pe; $p++) {
                $v = $native[$p - $first + 1];
                if (!is_nan($v)) {
                    $sum += $v;
                    $n++;
                }
            }
            if ($n > 0) $out[$k] = 1.0 * $sum / $n;
        }
        return $out;
    }

    private function clamp_pos($pos, $npoints) {
        if ($pos < 0) return 0;
        if ($pos > $npoints) return $npoints;
        return (int) $pos;
    }

    // Engine, meta and file handle for a feed, or false where the data is not
    // read directly
    private function open($feedid) {
        if (array_key_exists($feedid, $this->feeds)) return $this->feeds[$feedid];
        $this->feeds[$feedid] = false;

        if ($this->dir === null) return false;
        if (!$this->feed->exist($feedid)) return false;
        if ((int) $this->feed->get_field($feedid, 'engine') !== Engine::PHPFINA) return false;

        $metafile = $this->dir.$feedid.".meta";
        $datafile = $this->dir.$feedid.".dat";
        if (!is_file($metafile) || !is_file($datafile)) return false;

        $mh = fopen($metafile, 'rb');
        if (!$mh) return false;
        fseek($mh, 8);
        $tmp = fread($mh, 8);
        fclose($mh);
        if (strlen($tmp) != 8) return false;
        $tmp = unpack("I2", $tmp);
        $fi = $tmp[1];
        $fs = $tmp[2];
        if ($fi < 1) return false;

        $fh = fopen($datafile, 'rb');
        if (!$fh) return false;

        $this->feeds[$feedid] = array('fh' => $fh, 'interval' => $fi, 'start_time' => $fs);
        return $this->feeds[$feedid];
    }
}
