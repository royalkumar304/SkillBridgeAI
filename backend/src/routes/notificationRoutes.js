/**
 * Notification Routes
 * Mounted at: /api/v1/notifications
 */

const express = require('express');
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { authenticateToken } = require('../middleware/authMiddleware');

// All notification endpoints require valid JWT authentication
router.use(authenticateToken);

// GET   /api/v1/notifications — fetch notifications (supports ?page=&limit=&unreadOnly=true)
router.get('/', getNotifications);

// GET   /api/v1/notifications/unread-count — get lightweight badge count
router.get('/unread-count', getUnreadCount);

// PATCH /api/v1/notifications/read-all — mark all notifications as read
router.patch('/read-all', markAllAsRead);

// PATCH /api/v1/notifications/:id/read — mark single notification as read
router.patch('/:id/read', markAsRead);

// DELETE /api/v1/notifications/:id — delete single notification
router.delete('/:id', deleteNotification);

module.exports = router;
