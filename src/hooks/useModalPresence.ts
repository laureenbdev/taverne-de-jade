import { useEffect, useRef, useState } from 'react';

export const MODAL_DURATION_MS = 260;

/** Garde le nœud monté le temps de l’anim de fermeture. */
export function useModalPresence(open: boolean) {
	const [present, setPresent] = useState(open);
	const [shown, setShown] = useState(false);

	useEffect(() => {
		if (!open) {
			setShown(false);
			const timer = window.setTimeout(() => setPresent(false), MODAL_DURATION_MS);
			return () => window.clearTimeout(timer);
		}
		setPresent(true);
	}, [open]);

	useEffect(() => {
		if (!present || !open) return;
		const frame = requestAnimationFrame(() => setShown(true));
		return () => cancelAnimationFrame(frame);
	}, [present, open]);

	return { present, shown };
}

/** Conserve la dernière valeur non-nulle tant que la modale est encore montée. */
export function useModalPayload<T>(value: T | null | undefined, present: boolean): T | null {
	const ref = useRef<T | null>(value ?? null);
	if (value != null) ref.current = value;
	return present ? ref.current : null;
}
