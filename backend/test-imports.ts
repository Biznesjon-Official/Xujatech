// Test file to check imports
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

console.log('Express:', typeof express);
console.log('UUID:', typeof uuidv4);
console.log('Joi:', typeof Joi);

const app = express();
console.log('Express app created successfully');