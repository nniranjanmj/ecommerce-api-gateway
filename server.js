const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Service URLs (Private ALB endpoints)
const SERVICES = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3005'
};

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'E-commerce API Gateway', version: '1.0.0', services: ['users', 'products', 'orders', 'payments', 'inventory'] });
});

// Gateway routes
app.use('/api/users', createProxy(SERVICES.user));
app.use('/api/products', createProxy(SERVICES.product));
app.use('/api/orders', createProxy(SERVICES.order));
app.use('/api/payments', createProxy(SERVICES.payment));
app.use('/api/inventory', createProxy(SERVICES.inventory));

function createProxy(serviceUrl) {
  return async (req, res) => {
    try {
      const response = await axios({
        method: req.method,
        url: `${serviceUrl}${req.path}`,
        data: req.body,
        headers: { ...req.headers, host: undefined }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        error: error.response?.data || 'Service unavailable'
      });
    }
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'api-gateway' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API Gateway is running', version: '1.0.0' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
});