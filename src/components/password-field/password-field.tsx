import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeSlash } from 'phosphor-react';

import './password-field.scss';

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const PasswordField: React.FC<PasswordFieldProps> = ({ className, ...props }) => {
	const { t } = useTranslation();
	const [visible, setVisible] = useState(false);

	return (
		<div className={`password-field${className ? ` ${className}` : ''}`}>
			<input {...props} type={visible ? 'text' : 'password'} />
			<button
				type="button"
				className="password-field-toggle"
				tabIndex={-1}
				aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
				aria-pressed={visible}
				onClick={() => setVisible((open) => !open)}
			>
				{visible ? <EyeSlash size={18} /> : <Eye size={18} />}
			</button>
		</div>
	);
};

export default PasswordField;
