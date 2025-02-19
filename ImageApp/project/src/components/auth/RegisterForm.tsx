import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { registerUser, getAuthErrorMessage } from '../../lib/auth';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  email: z.string()
    .email('Inserisci un indirizzo email valido')
    .min(1, 'Email richiesta'),
  password: z.string()
    .min(8, 'La password deve essere di almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero')
    .regex(/[^A-Za-z0-9]/, 'La password deve contenere almeno un carattere speciale'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"]
});

type FormData = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateField = (field: keyof FormData, value: string) => {
    try {
      const fieldSchema = field === 'confirmPassword' 
        ? registerSchema
        : registerSchema.pick({ [field]: true });
      
      fieldSchema.parse({ 
        ...formData, 
        [field]: value,
        ...(field === 'confirmPassword' ? {} : { confirmPassword: value })
      });
      
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(e => e.path.includes(field));
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field]: fieldError.message
          }));
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name as keyof FormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    try {
      // Validate all fields
      registerSchema.parse(formData);
      
      setLoading(true);
      await registerUser(formData.email, formData.password);
      navigate('/verify-email');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        console.error('Registration error:', error);
        setGeneralError(getAuthErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldClassName = (field: keyof FormData) => `
    w-full pl-10 p-2 bg-gray-700 border rounded text-white transition-colors
    ${errors[field] 
      ? 'border-red-500 focus:border-red-500' 
      : 'border-gray-600 focus:border-[--theater-gold]'
    }
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center gap-2"
        >
          <AlertCircle size={20} />
          {generalError}
        </motion.div>
      )}

      <div>
        <label className="block text-gray-300 mb-2" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            errors.email ? 'text-red-500' : 'text-gray-400'
          }`} size={20} />
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={getFieldClassName('email')}
            required
          />
        </div>
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.email}
          </motion.p>
        )}
      </div>

      <div>
        <label className="block text-gray-300 mb-2" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            errors.password ? 'text-red-500' : 'text-gray-400'
          }`} size={20} />
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className={getFieldClassName('password')}
            required
          />
        </div>
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.password}
          </motion.p>
        )}
      </div>

      <div>
        <label className="block text-gray-300 mb-2" htmlFor="confirmPassword">
          Conferma Password
        </label>
        <div className="relative">
          <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            errors.confirmPassword ? 'text-red-500' : 'text-gray-400'
          }`} size={20} />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={getFieldClassName('confirmPassword')}
            required
          />
        </div>
        {errors.confirmPassword && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.confirmPassword}
          </motion.p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || Object.keys(errors).length > 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" />
            Registrazione in corso...
          </>
        ) : (
          <>
            <User size={20} />
            Registrati
          </>
        )}
      </button>

      <p className="text-center text-gray-400">
        Hai già un account?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-[--theater-gold] hover:underline"
        >
          Accedi
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;