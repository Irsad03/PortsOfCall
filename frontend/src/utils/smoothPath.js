export function catmullRomPath(pts, tension = 1) {
    if (!pts || pts.length < 2) return '';
    if (pts.length === 2) {
        return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;
    }
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
        const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
        const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
        const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
        d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    return d;
}

export function catmullRomPointAt(pts, exactIdx, tension = 1) {
    const n = pts ? pts.length : 0;
    if (n === 0) return null;
    if (n === 1) return { x: pts[0].x, y: pts[0].y, angle: 0 };

    const lastSeg = n - 2;
    const clamped = Math.max(0, Math.min(exactIdx, n - 1));
    let i = Math.floor(clamped);
    if (i > lastSeg) i = lastSeg;
    const t = clamped - i;

    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;

    const mt = 1 - t;
    const x = mt * mt * mt * p1.x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * p2.x;
    const y = mt * mt * mt * p1.y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * p2.y;

    let dx = 3 * mt * mt * (c1x - p1.x) + 6 * mt * t * (c2x - c1x) + 3 * t * t * (p2.x - c2x);
    let dy = 3 * mt * mt * (c1y - p1.y) + 6 * mt * t * (c2y - c1y) + 3 * t * t * (p2.y - c2y);
    if (dx === 0 && dy === 0) {
        dx = p2.x - p1.x;
        dy = p2.y - p1.y;
    }

    return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

export function polylineCumLengths(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
        cum[i] = cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    return cum;
}

export function fractionalIndexAtDistance(cum, dist) {
    const total = cum[cum.length - 1];
    if (!(total > 0)) return 0;
    const d = Math.max(0, Math.min(dist, total));
    for (let i = 0; i < cum.length - 1; i++) {
        const segLen = cum[i + 1] - cum[i];
        if (d <= cum[i + 1] || i === cum.length - 2) {
            return i + (segLen > 0 ? (d - cum[i]) / segLen : 0);
        }
    }
    return cum.length - 1;
}
