"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
router.get('/status', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        data: {
            pendingOperations: 0,
            lastSync: new Date().toISOString(),
            isOnline: true
        }
    });
}));
router.post('/manual', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        message: 'Sync initiated successfully'
    });
}));
exports.default = router;
//# sourceMappingURL=sync.js.map