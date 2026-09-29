// Watts to kW: one decimal place below 10 kW, whole numbers above
function as_kw (w) {
    var kw = w / 1000
    if (Math.abs(kw) < 10) {
        kw = kw.toFixed(1)
    } else {
        kw = Math.round(kw)
    }
    if (kw === '0.0') {
        kw = 0
    }
    return kw
}