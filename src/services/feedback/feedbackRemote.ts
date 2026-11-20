import { supabase } from '../../lib/supabase.js';
import type { FeedbackSubject, FeedbackType } from '../../features/admin/types.ts';

export async function submitFeedback(params: {
	userId: string;
	message: string;
	feedbackType: FeedbackType;
	subject: FeedbackSubject;
}): Promise<string | null> {
	if (!supabase) return 'not_configured';

	const message = params.message.trim();
	if (message.length < 1 || message.length > 4000) {
		return 'invalid_message';
	}

	const { error } = await supabase.from('feedback').insert({
		user_id: params.userId,
		message,
		feedback_type: params.feedbackType,
		subject: params.subject,
		status: 'a_classer',
	});

	return error ? error.message : null;
}
