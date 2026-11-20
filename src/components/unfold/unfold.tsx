import React, { useEffect, useRef, useState } from 'react';

const DURATION = 240;

export function usePresence(open: boolean) {
	const [present, setPresent] = useState(open);
	const [shown, setShown] = useState(false);

	useEffect(() => {
		if (!open) {
			setShown(false);
			const timer = window.setTimeout(() => setPresent(false), DURATION);
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

/** True only if `loading` was true at least once, then became false. */
export function useLateReveal(loading: boolean) {
	const sawLoading = useRef(false);
	if (loading) sawLoading.current = true;
	return !loading && sawLoading.current;
}

interface UnfoldProps {
	open: boolean;
	className?: string;
	children: React.ReactNode;
}

const Unfold: React.FC<UnfoldProps> = ({ open, className, children }) => {
	const { present, shown } = usePresence(open);

	if (!present) return null;

	return (
		<div className={`unfold${shown ? ' is-open' : ''}${className ? ` ${className}` : ''}`}>
			<div className="unfold-inner">{children}</div>
		</div>
	);
};

interface LateUnfoldProps {
	loading: boolean;
	className?: string;
	fallback?: React.ReactNode;
	children: React.ReactNode;
}

/** Anime l’apparition seulement si le contenu arrive après un chargement. */
export const LateUnfold: React.FC<LateUnfoldProps> = ({
	loading,
	className,
	fallback = null,
	children,
}) => {
	const animate = useLateReveal(loading);
	if (loading) return <>{fallback}</>;
	if (!animate) return <>{children}</>;
	return <Unfold open className={className}>{children}</Unfold>;
};

export default Unfold;
