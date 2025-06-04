import React, { useState } from 'react';
import RegisterForm from './RegisterForm';

function LoginForm({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [showRegister, setShowRegister] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) throw new Error('Credenciales incorrectas');

            const data = await res.json();
            onLogin(data.token); // asegúrate de que tu backend devuelva el token
        } catch (err) {
            setError(err.message);
        }
    };

    if (showRegister) {
        return <RegisterForm onLogin={onLogin} goBack={() => setShowRegister(false)} />;
    }

    return (
        <div className="login-container">
            <h2>Iniciar sesión</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Contraseña:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit">Entrar</button>
            </form>
            <p style={{ marginTop: '10px' }}>
                ¿No tienes cuenta?{' '}
                <button onClick={() => setShowRegister(true)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}>
                    Regístrate
                </button>
            </p>
        </div>
    );
}

export default LoginForm;
