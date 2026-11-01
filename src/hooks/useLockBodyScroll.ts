import { useEffect } from 'react';

let locks = 0;

export function useLockBodyScroll(locked: boolean) {
	useEffect(() => {
		if (!locked) return;

		locks += 1;
		const scrollbar = window.innerWidth - document.documentElement.clientWidth;
		document.body.classList.add('modal-open');
		if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

		return () => {
			locks -= 1;
			if (locks > 0) return;
			document.body.classList.remove('modal-open');
			document.body.style.paddingRight = '';
		};
	}, [locked]);
}
