import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError('Por favor ingresa tu correo y contraseña.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await login(email.trim(), password);
            navigate('/');
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Correo o contraseña incorrectos.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Demasiados intentos fallidos. Intenta más tarde.');
            } else {
                setError('Error al conectar con el servidor de autenticación.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-3 shadow-inner">
                        <Wrench size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">JJLAB Admin</h2>
                    <p className="text-slate-500 text-sm mt-1">Ingresa con tu cuenta de administrador</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-medium animate-fadeIn">
                            <AlertCircle size={17} className="shrink-0 text-red-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Correo Electrónico</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-800 transition-all"
                                    placeholder="admin@jjlab.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Contraseña</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-800 transition-all"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/30 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Iniciando sesión...</span>
                                </>
                            ) : (
                                <span>Iniciar Sesión</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
