function as_kw (w) {
    var kw = w / 1000
    if (kw < 1) {
        kw = kw.toFixed(1)
    } else {
        kw = Math.round(kw)
    }
    if (kw === '0.0') {
        kw = 0
    }
    return kw
}