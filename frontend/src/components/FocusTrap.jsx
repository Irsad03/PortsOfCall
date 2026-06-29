import { useEffect, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR = [
    'a[href]', 'area[href]', 'button:not([disabled])',
    'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusablesIn(box) {
    return [...box.querySelectorAll(FOCUSABLE_SELECTOR)]
        .filter(el => el.getClientRects().length > 0);
}

const trapStack = [];

function useFocusTrap() {
    const ref = useRef(null);
    const [opener] = useState(() => (typeof document !== 'undefined' ? document.activeElement : null));

    useEffect(() => {
        const box = ref.current;
        if (!box) return undefined;

        const entry = { box };
        trapStack.push(entry);

        if (!box.contains(document.activeElement)) {
            const f = focusablesIn(box);
            (f[0] ?? box).focus();
        }

        const onKeyDown = (e) => {
            if (e.key !== 'Tab') return;
            if (trapStack[trapStack.length - 1] !== entry) return;
            const f = focusablesIn(box);
            if (f.length === 0) { e.preventDefault(); box.focus(); return; }
            const first = f[0];
            const last = f[f.length - 1];
            const active = document.activeElement;
            if (!box.contains(active)) { e.preventDefault(); first.focus(); return; }
            if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
        };

        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
            const i = trapStack.indexOf(entry);
            if (i !== -1) trapStack.splice(i, 1);
            // Return focus to the opener, but only if it's still in the document.
            if (opener && document.contains(opener) && typeof opener.focus === 'function') {
                opener.focus();
            }
        };
    }, [opener]);

    return ref;
}

export function FocusTrap({ children, ...props }) {
    const ref = useFocusTrap();
    return (
        <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" {...props}>
            {children}
        </div>
    );
}
