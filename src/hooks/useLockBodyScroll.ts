import { useEffect } from 'react';

let locks = 0;

const SCROLL_KEYS = new Set([
	' ',
	'Spacebar',
	'PageUp',
	'PageDown',
	'Home',
	'End',
	'ArrowUp',
	'ArrowDown',
]);

/* Espace et flèches y ont leur propre action (activer un bouton, déplacer le curseur…) */
const INTERACTIVE = 'button, a[href], input, textarea, select, [tabindex], [contenteditable="true"]';

/** Scroll interne (modale, listes…) autorisé ; le document reste figé. */
function allowsScroll(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;
	let el: Element | null = target;
	while (el && el !== document.documentElement && el !== document.body) {
		const style = window.getComputedStyle(el);
		const y = style.overflowY;
		if ((y === 'auto' || y === 'scroll' || y === 'overlay') && el.scrollHeight > el.clientHeight) {
			return true;
		}
		const x = style.overflowX;
		if ((x === 'auto' || x === 'scroll' || x === 'overlay') && el.scrollWidth > el.clientWidth) {
			return true;
		}
		el = el.parentElement;
	}
	return false;
}

export function useLockBodyScroll(locked: boolean) {
	useEffect(() => {
		if (!locked) return;

		locks += 1;
		document.body.classList.add('modal-open');
		const x = window.scrollX;
		const y = window.scrollY;

		/* les modales sont rendues hors de #root : le reste de la page devient inerte (Tab reste dans la modale) */
		const root = document.getElementById('root');
		const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		root?.setAttribute('inert', '');
		const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
		const dialog = dialogs[dialogs.length - 1];
		if (dialog && !dialog.contains(document.activeElement)) {
			if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
			dialog.focus({ preventScroll: true });
		}

		const freeze = () => window.scrollTo(x, y);

		const onWheel = (event: WheelEvent) => {
			if (allowsScroll(event.target)) return;
			event.preventDefault();
		};

		const onTouchMove = (event: TouchEvent) => {
			if (allowsScroll(event.target)) return;
			event.preventDefault();
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (!SCROLL_KEYS.has(event.key)) return;
			const target = event.target;
			if (target instanceof HTMLElement && target.closest(INTERACTIVE)) return;
			if (allowsScroll(event.target)) return;
			event.preventDefault();
		};

		window.addEventListener('scroll', freeze);
		window.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('keydown', onKeyDown);

		return () => {
			locks -= 1;
			window.removeEventListener('scroll', freeze);
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('keydown', onKeyDown);
			if (locks === 0) {
				document.body.classList.remove('modal-open');
				root?.removeAttribute('inert');
			}
			if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({ preventScroll: true });
			else if (document.activeElement === document.body) document.getElementById('main-content')?.focus({ preventScroll: true });
		};
	}, [locked]);
}
