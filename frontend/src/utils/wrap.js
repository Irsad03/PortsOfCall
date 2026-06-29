export function wrapDelta(dx, max = 1000) {
    const half = max / 2;
    if (dx > half) return dx - max;
    if (dx < -half) return dx + max;
    return dx;
}

export function unwrapWaypoints(wps, max = 1000) {
    if (!wps || wps.length === 0) return wps || [];
    const out = [{ x: wps[0].x, y: wps[0].y }];
    let cx = wps[0].x;
    for (let i = 1; i < wps.length; i++) {
        cx += wrapDelta(wps[i].x - wps[i - 1].x, max);
        out.push({ x: cx, y: wps[i].y });
    }
    return out;
}
