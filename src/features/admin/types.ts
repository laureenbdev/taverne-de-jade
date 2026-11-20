export interface AdminUserRow {
	id: string;
	email: string;
	displayName: string;
	uid: string;
	server: string;
	isAdmin: boolean;
	createdAt: string;
	lastSignInAt: string;
}

export type FeedbackType = 'bug' | 'suggestion' | 'other';

export type FeedbackSubject =
	| 'home'
	| 'advancement'
	| 'planner'
	| 'wishes'
	| 'wishlist'
	| 'settings'
	| 'auth'
	| 'other';

export type FeedbackStatus = 'a_classer' | 'a_traiter' | 'traite' | 'a_ignorer';

export const FEEDBACK_TYPES: FeedbackType[] = ['bug', 'suggestion', 'other'];

export const FEEDBACK_SUBJECTS: FeedbackSubject[] = [
	'home',
	'advancement',
	'planner',
	'wishes',
	'wishlist',
	'settings',
	'auth',
	'other',
];

export const FEEDBACK_STATUSES: FeedbackStatus[] = [
	'a_classer',
	'a_traiter',
	'traite',
	'a_ignorer',
];

export interface FeedbackRow {
	id: string;
	userId: string;
	email: string;
	displayName: string;
	message: string;
	feedbackType: FeedbackType;
	subject: FeedbackSubject;
	status: FeedbackStatus;
	createdAt: string;
}

export interface ImpersonationState {
	adminAccessToken: string;
	adminRefreshToken: string;
	adminEmail: string;
	targetEmail: string;
	targetDisplayName: string;
}
