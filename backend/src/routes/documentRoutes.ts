import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import * as documentController from '../controllers/documentController.js';

const router = Router();

router.post('/upload', upload.array('files', 10), documentController.uploadDocuments);
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);
router.get('/:id/download', documentController.downloadDocument);

export default router;
