import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../components/UIComponents';
import { login } from '../services/authService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Langsung panggil login, biarkan authService mengambil URL yang benar dari storageService
      const result = await login(username, password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Login gagal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 max-w-md mx-auto transition-colors duration-200">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 border-4 border-blue-50 dark:border-blue-900/30">
            <img 
                src="https://iili.io/fzEDnst.png" 
                alt="Logo Tut Wuri Handayani" 
                className="w-12 h-12 object-contain"
            />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GuruHadir</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Aplikasi Absensi SD NEGERI JAMBU</p>
      </div>

      <Card className="w-full shadow-xl border-t-4 border-blue-600 dark:border-blue-500">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Lock size={18} className="text-blue-600 dark:text-blue-400" />
            Silakan Masuk
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Username"
            placeholder="Username (sesuai spreadsheet)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs p-3 rounded-lg border border-red-100 dark:border-red-900 flex items-start gap-2">
               <AlertCircle size={14} className="mt-0.5 shrink-0" />
               <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full text-lg mt-2" 
            isLoading={isLoading}
          >
            MASUK APLIKASI
          </Button>
        </form>

      </Card>
      
      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-8 text-center">
        &copy; {new Date().getFullYear()} SD Negeri Jambu. Kec. Tunjung Teja.
      </p>
    </div>
  );
};