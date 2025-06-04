import { useState } from 'react';
import { BASE_URL } from '../services/api';


function LoginRegisterForm({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const endpoint = isLogin ? 'login' : 'register';

        try {
            console.log(`Enviando solicitud de ${isLogin ? 'inicio de sesión' : 'registro'} a ${BASE_URL}/auth/${endpoint}`);
            const res = await fetch(`${BASE_URL}/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            console.log('Respuesta del servidor:', res);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error de autenticación');
            }

            const data = await res.json();

            if (isLogin) {
                onLogin(data.token); // <- guardar el JWT
            } else {
                alert('Registro exitoso. Ahora puedes iniciar sesión.');
                setIsLogin(true);
            }

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <h2>{isLogin ? 'Iniciar sesión' : 'Registrarse'}</h2>
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
                <button type="submit">{isLogin ? 'Entrar' : 'Registrarse'}</button>
            </form>
            <p style={{ marginTop: '10px' }}>
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? 'Regístrate' : 'Inicia sesión'}
                </button>
            </p>
        </div>
    );
}

export default LoginRegisterForm;
