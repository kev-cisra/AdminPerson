"use client"
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useToast } from '../../contexts/ToastContext';
import { useAuthContext } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const { login, loading, isAuthenticated } = useAuthContext();
  const router = useRouter();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      showInfo("Iniciando sesión...", 2000);
      
      const user = await login(values);
      console.log(user);
      
      showSuccess(`¡Bienvenido ${user.nombre || user.email}!`, 4000);
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (error: any) {
      showError(error.message || "Error al iniciar sesión", 5000);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card title="Iniciar sesión" style={{ width: 350 }}>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="Correo electrónico"
            name="email"
            rules={[{ required: true, message: 'Por favor ingresa tu correo electrónico' }]}
          >
            <Input type="email" placeholder="ejemplo@correo.com" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
          >
            <Input.Password placeholder="Contraseña" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Ingresar'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm;
