import React from 'react';
import { Navigate } from 'react-router-dom';

import AdminGate from '../../features/admin/AdminGate.tsx';

const AdminPage: React.FC = () => (
	<AdminGate>
		<Navigate to="/admin/users" replace />
	</AdminGate>
);

export default AdminPage;
