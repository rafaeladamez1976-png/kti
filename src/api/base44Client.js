import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

// Mock client for demo mode to prevent SDK from making real calls that fail with "Private App" errors
const createMockClient = () => {
  console.log('Using Base44 Mock Client');
  return {
    auth: {
      isAuthenticated: () => Promise.resolve(true),
      me: () => Promise.resolve({
        id: 'demo-user',
        full_name: 'Usuario Demo',
        email: 'demo@base44.app',
        role: 'admin',
        activo: true
      }),
      logout: () => { window.location.href = '/'; },
      redirectToLogin: () => { window.location.href = '/login'; }
    },
    entities: {
      Territorio: { list: () => Promise.resolve([]), filter: () => Promise.resolve([]), create: () => Promise.resolve({}), update: () => Promise.resolve({}) },
      Analisis: { list: () => Promise.resolve([]), filter: () => Promise.resolve([]), create: () => Promise.resolve({}), update: () => Promise.resolve({}) },
      Hallazgo: { list: () => Promise.resolve([]), filter: () => Promise.resolve([]), create: () => Promise.resolve({}), update: () => Promise.resolve({}) },
      Alerta: { list: () => Promise.resolve([]), filter: () => Promise.resolve([]), create: () => Promise.resolve({}), update: () => Promise.resolve({}) },
      ImagenSatelital: { filter: () => Promise.resolve([]) }
    }
  };
};

export const base44 = (appId === 'demo-app-id' || !appId)
  ? createMockClient()
  : createClient({
      appId,
      serverUrl,
      token,
      functionsVersion,
      requiresAuth: false
    });

