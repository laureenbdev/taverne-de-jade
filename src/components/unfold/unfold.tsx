import React, { useEffect, useState } from 'react';

const DURATION = 320;

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

export default Unfold;
