import { createEphemeralSupabaseClient, supabase } from '../../lib/supabase.js';
import type { AdminUserRow, FeedbackRow, FeedbackStatus } from '../../features/admin/types.ts';

type RpcUser = {
	id: string;
	email: string | null;
	display_name: string | null;
	uid: string | null;
	server: string | null;
	is_admin: boolean | null;
	created_at: string | null;
	last_sign_in_at: string | null;
};

type RpcFeedback = {
	id: string;
	user_id: string;
	email: string | null;
	display_name: string | null;
	message: string;
	feedback_type: string;
	subject: string;
	status: string;
	created_at: string;
};

function mapUser(row: RpcUser): AdminUserRow {
	return {
		id: row.id,
		email: row.email || '',
		displayName: row.display_name || '',
		uid: row.uid || '',
		server: row.server || '',
		isAdmin: Boolean(row.is_admin),
		createdAt: row.created_at || '',
		lastSignInAt: row.last_sign_in_at || '',
	};
}

function mapFeedback(row: RpcFeedback): FeedbackRow {
	return {
		id: row.id,
		userId: row.user_id,
		email: row.email || '',
		displayName: row.display_name || '',
		message: row.message,
		feedbackType: row.feedback_type as FeedbackRow['feedbackType'],
		subject: row.subject as FeedbackRow['subject'],
		status: row.status as FeedbackStatus,
		createdAt: row.created_at,
	};
}

function mapAdminRpcError(message: string, fallback: string) {
	const normalized = message.toLowerCase();
	if (normalized.includes('forbidden')) return 'forbidden';
	if (normalized.includes('admin_secrets') || normalized.includes('not configured') || normalized.includes('service_role')) {
		return 'admin_secrets_missing';
	}
	if (
		(normalized.includes('could not find') && normalized.includes('function'))
		|| normalized.includes('admin_create_user')
		|| normalized.includes('admin_update_user')
		|| normalized.includes('admin_delete_user')
		|| normalized.includes('admin_impersonate')
		|| normalized.includes('schema cache')
	) {
		return 'admin_rpc_missing';
	}
	if (normalized.includes('already') || normalized.includes('registered') || normalized.includes('exists')) {
		return 'alreadyRegistered';
	}
	if (normalized.includes('invalid_email')) return 'invalid_email';
	if (normalized.includes('weak_password')) return 'weak_password';
	if (normalized.includes('invalid_display_name')) return 'invalid_display_name';
	if (normalized.includes('user_not_found')) return 'user_not_found';
	if (normalized.includes('cannot_impersonate_self')) return 'cannot_impersonate_self';
	if (normalized.includes('cannot_delete_self')) return 'cannot_delete_self';
	if (normalized.includes('cannot_delete_admin')) return 'cannot_delete_admin';
	return fallback;
}

function isMissingRpc(message: string) {
	const key = mapAdminRpcError(message, '');
	return key === 'admin_rpc_missing' || key === 'admin_secrets_missing';
}

async function createAdminUserViaSignup(params: {
	email: string;
	password: string;
	displayName: string;
}): Promise<string | null> {
	const client = createEphemeralSupabaseClient();
	if (!client) return 'not_configured';

	const email = params.email.trim().toLowerCase();
	const displayName = params.displayName.trim();

	const { data, error } = await client.auth.signUp({
		email,
		password: params.password,
		options: { data: { display_name: displayName, name: displayName } },
	});
	if (error) {
		return mapAdminRpcError(error.message, error.message || 'create_failed');
	}
	if (!data.user) return 'create_failed';

	if (data.session) {
		const { error: profileError } = await client.from('profiles').upsert({
			id: data.user.id,
			display_name: displayName,
			language: 'fr',
			is_admin: false,
		}, { onConflict: 'id' });
		if (profileError && !/display_name|is_admin|schema cache/i.test(profileError.message)) {
			return profileError.message;
		}
		await client.auth.signOut();
	}

	return null;
}

export async function listAdminUsers(): Promise<{ users: AdminUserRow[]; error: string | null }> {
	if (!supabase) return { users: [], error: 'not_configured' };
	const { data, error } = await supabase.rpc('admin_list_users');
	if (error) return { users: [], error: error.message };
	return { users: ((data || []) as RpcUser[]).map(mapUser), error: null };
}

export async function createAdminUser(params: {
	email: string;
	password: string;
	displayName: string;
}): Promise<string | null> {
	if (!supabase) return 'not_configured';

	const email = params.email.trim();
	const displayName = params.displayName.trim();
	if (!email.includes('@')) return 'invalid_email';
	if (params.password.length < 8) return 'weak_password';
	if (displayName.length < 2 || displayName.length > 24) return 'invalid_display_name';

	const { error } = await supabase.rpc('admin_create_user', {
		p_email: email,
		p_password: params.password,
		p_display_name: displayName,
	});

	if (!error) return null;

	// Pas de RPC / secrets : création via signup isolé (sans toucher à la session admin)
	if (isMissingRpc(error.message)) {
		return createAdminUserViaSignup({
			email,
			password: params.password,
			displayName,
		});
	}

	return mapAdminRpcError(error.message, error.message || 'create_failed');
}

export async function updateAdminUser(params: {
	userId: string;
	email: string;
	displayName: string;
	password?: string;
}): Promise<string | null> {
	if (!supabase) return 'not_configured';

	const email = params.email.trim();
	const displayName = params.displayName.trim();
	const password = (params.password || '').trim();
	if (!email.includes('@')) return 'invalid_email';
	if (displayName.length < 2 || displayName.length > 24) return 'invalid_display_name';
	if (password && password.length < 8) return 'weak_password';

	const { error } = await supabase.rpc('admin_update_user', {
		p_user_id: params.userId,
		p_email: email,
		p_display_name: displayName,
		p_password: password || null,
	});

	if (!error) return null;
	return mapAdminRpcError(error.message, error.message || 'update_failed');
}

export async function deleteAdminUser(userId: string): Promise<string | null> {
	if (!supabase) return 'not_configured';

	const { error } = await supabase.rpc('admin_delete_user', {
		p_user_id: userId,
	});

	if (!error) return null;
	return mapAdminRpcError(error.message, error.message || 'delete_failed');
}

export async function impersonateUser(userId: string): Promise<{
	accessToken?: string;
	refreshToken?: string;
	error: string | null;
}> {
	if (!supabase) return { error: 'not_configured' };

	const { data, error } = await supabase.rpc('admin_impersonate', {
		p_user_id: userId,
	});

	if (error) {
		return { error: mapAdminRpcError(error.message, error.message || 'impersonate_failed') };
	}

	const row = data as { access_token?: string; refresh_token?: string; error?: string } | null;
	if (row?.error) {
		return { error: mapAdminRpcError(row.error, row.error) };
	}
	if (!row?.access_token || !row?.refresh_token) {
		return { error: 'impersonate_failed' };
	}

	return {
		accessToken: row.access_token,
		refreshToken: row.refresh_token,
		error: null,
	};
}

export async function listAdminFeedback(): Promise<{ items: FeedbackRow[]; error: string | null }> {
	if (!supabase) return { items: [], error: 'not_configured' };
	const { data, error } = await supabase.rpc('admin_list_feedback');
	if (error) return { items: [], error: error.message };
	return { items: ((data || []) as RpcFeedback[]).map(mapFeedback), error: null };
}

export async function setFeedbackStatus(
	feedbackId: string,
	status: FeedbackStatus,
): Promise<string | null> {
	if (!supabase) return 'not_configured';
	const { error } = await supabase.rpc('admin_set_feedback_status', {
		feedback_id: feedbackId,
		new_status: status,
	});
	return error ? error.message : null;
}
