const MAN_CROP = { x: 657, y: 421, w: 148, h: 91 };

const DRAW_W = 80;
const DRAW_H = 50;

const ANCHOR_X_FRAC = 0.57;
const ANCHOR_Y_FRAC = 0.78;

const STYLES = {
  struggle: (t, k) => {
    const fast   = Math.sin(t * 6.5);
    const med    = Math.sin(t * 4.0 + 1.3);
    const slow   = Math.sin(t * 1.7 + 0.4);
    const wobble = Math.sin(t * 0.7) * 0.4 + 0.6;
    return {
      bobY:   (fast * 2.6 + slow * 1.4) * k,
      bobX:   med * 1.0 * k,
      sway:   (Math.sin(t * 5.8) * 0.13 + Math.sin(t * 1.5) * 0.05) * wobble * k,
      scaleY: 1 + Math.sin(t * 6.5 + 1.0) * 0.03 * k,
      scaleX: 1 + Math.cos(t * 6.5 + 0.5) * 0.02 * k,
      splashRate: 6 * wobble * k,
      rippleRate: 1.4,
    };
  },
  float: (t, k) => {
    const breath = Math.sin(t * 1.4);
    return {
      bobY:   breath * 3.5 * k,
      bobX:   Math.sin(t * 0.9) * 1.2 * k,
      sway:   Math.sin(t * 1.1) * 0.06 * k,
      scaleY: 1 + breath * 0.018 * k,
      scaleX: 1 + Math.cos(t * 1.4) * 0.012 * k,
      splashRate: 0.8,
      rippleRate: 0.5,
    };
  },
};

export function buildSailorSprite(img) {
    const off = document.createElement('canvas');
    off.width  = MAN_CROP.w;
    off.height = MAN_CROP.h;
    const ctx  = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, MAN_CROP.x, MAN_CROP.y, MAN_CROP.w, MAN_CROP.h,
                       0, 0, MAN_CROP.w, MAN_CROP.h);

    const data = ctx.getImageData(0, 0, MAN_CROP.w, MAN_CROP.h);
    const px   = data.data;
    for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const brightness = (r + g + b) / 3;
        if (b > 95 && b > r + 25 && b > g - 5 && brightness > 60) {
            px[i + 3] = 0;
        }
    }
    ctx.putImageData(data, 0, 0);
    return off;
}

export function stepSailor(anim, now, dt, style = 'struggle', intensity = 1) {
    if (!anim.t0) anim.t0 = now;
    const t = now - anim.t0;
    const styleFn = STYLES[style] || STYLES.struggle;
    const k = Math.max(0, intensity);
    const p = styleFn(t, k);
    anim.params = p;
    anim.t = t;

    anim.splashAcc = (anim.splashAcc || 0) + dt * p.splashRate;
    while (anim.splashAcc >= 1) {
        anim.splashAcc -= 1;
        spawnSplash(anim, now);
    }
    anim.rippleAcc = (anim.rippleAcc || 0) + dt * p.rippleRate;
    while (anim.rippleAcc >= 1) {
        anim.rippleAcc -= 1;
        spawnRipple(anim, now);
    }
}

export function drawSailor(ctx, anim, sprite, pos) {
    if (!sprite) return;
    const p = anim.params || { bobX: 0, bobY: 0, sway: 0, scaleX: 1, scaleY: 1 };
    const drawW = DRAW_W * p.scaleX;
    const drawH = DRAW_H * p.scaleY;
    const anchorOffX = (ANCHOR_X_FRAC - 0.5) * drawW;
    const anchorOffY = (ANCHOR_Y_FRAC - 0.5) * drawH;

    ctx.save();
    ctx.translate(pos.x + p.bobX, pos.y - p.bobY);
    ctx.rotate(p.sway);
    ctx.drawImage(sprite,
        -drawW / 2 - anchorOffX,
        -drawH / 2 - anchorOffY,
        drawW, drawH);
    ctx.restore();
}

export function spawnSplash(anim, now) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 18 + Math.random() * 38;
    anim.splashes.push({
        t0:   now,
        life: 0.45 + Math.random() * 0.35,
        ox:   Math.cos(angle) * 4,
        oy:   Math.sin(angle) * 2,
        vx:   Math.cos(angle) * speed,
        vy:   Math.sin(angle) * speed - 24 - Math.random() * 32,
        r:    0.9 + Math.random() * 1.4,
    });
}

export function spawnRipple(anim, now) {
    anim.ripples.push({ t0: now, life: 1.3 + Math.random() * 0.6 });
}

export function drawSplashes(ctx, anim) {
    const now = (performance.now() / 1000);
    const list = anim.splashes;
    for (let i = list.length - 1; i >= 0; i -= 1) {
        if (now - list[i].t0 > list[i].life) list.splice(i, 1);
    }
    ctx.save();
    ctx.fillStyle = '#eaf3ff';
    for (const s of list) {
        const age = now - s.t0;
        const x = s.ox + s.vx * age;
        const y = s.oy + s.vy * age + 50 * age * age;
        const alpha = Math.max(0, 1 - age / s.life);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(anim._lastPosX + x, anim._lastPosY + y, s.r * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

export function drawRipples(ctx, anim, pos) {
    anim._lastPosX = pos.x;
    anim._lastPosY = pos.y;

    const now = (performance.now() / 1000);
    const list = anim.ripples;
    for (let i = list.length - 1; i >= 0; i -= 1) {
        if (now - list[i].t0 > list[i].life) list.splice(i, 1);
    }
    ctx.save();
    for (const r of list) {
        const age   = (now - r.t0) / r.life;
        const rad   = 10 + age * 38;
        const alpha = (1 - age) * 0.55;
        if (alpha <= 0) continue;
        ctx.lineWidth   = 1 + (1 - age) * 1.5;
        ctx.strokeStyle = `rgba(220, 240, 255, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 2, rad, rad * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}
