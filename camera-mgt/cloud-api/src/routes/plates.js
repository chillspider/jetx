const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const plateController = require('../controllers/plateController');
const validationMiddleware = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/default');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = config.upload.allowedMimeTypes;
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// Get all plate recognitions with filtering
router.get('/', 
  validationMiddleware.validatePagination(),
  validationMiddleware.validateDateRange(),
  asyncHandler(plateController.getRecognitions)
);

// Get plate recognition statistics
router.get('/stats', 
  validationMiddleware.validateDateRange(),
  asyncHandler(plateController.getRecognitionStats)
);

// Process image for plate recognition (file upload)
router.post('/recognize', 
  upload.single('image'),
  validationMiddleware.validateFileUpload(),
  asyncHandler(plateController.recognizePlateFromFile)
);

// Process image for plate recognition (URL)
router.post('/recognize/url', 
  asyncHandler(plateController.recognizePlateFromUrl)
);

// Get plate recognition by ID
router.get('/:id', 
  validationMiddleware.validateUuidParam('id'),
  asyncHandler(plateController.getRecognition)
);

module.exports = router;