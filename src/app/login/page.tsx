"use client"
import React from 'react';
import { Form, Input, Button, Card } from 'antd';

const LoginForm: React.FC = () => {
  const onFinish = (values: any) => {
    // Aquí puedes manejar el login
    console.log('Success:', values);
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
            <Button type="primary" htmlType="submit" block>
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm;
