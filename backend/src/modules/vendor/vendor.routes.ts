import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin, isAuthenticated } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { vendorRegistrationSchema, vendorApprovalSchema, updateVendorProfileSchema } from '../../validators/vendor.validator';

const router = Router();

router.use(authenticate);

router.post('/register', isAuthenticated, validate(vendorRegistrationSchema), VendorController.register);
router.get('/profile', isAuthenticated, VendorController.getProfile);
router.patch('/profile', isAuthenticated, validate(updateVendorProfileSchema), VendorController.updateProfile);
router.post('/documents', isAuthenticated, upload.array('documents', 5), VendorController.uploadDocuments);
router.get('/dashboard/stats', isAuthenticated, VendorController.getDashboardStats);

// Admin routes
router.get('/', isAdmin, VendorController.listVendors);
router.patch('/:vendorId/approval', isAdmin, validate(vendorApprovalSchema), VendorController.approve);

export default router;
