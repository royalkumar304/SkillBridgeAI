/**
 * Notification Controller
 * Manages authenticated user's notification feed, read receipts, and deletions.
 */

const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * GET /api/v1/notifications
 * Returns authenticated user's notifications with pagination & unread count.
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Strictly enforce recipient isolation using authenticated user id
    const filter = {
      $or: [{ recipient: req.user.id }, { recipientId: req.user.id }],
    };

    if (unreadOnly === 'true' || unreadOnly === true) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('actor', 'name email role')
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        $or: [{ recipient: req.user.id }, { recipientId: req.user.id }],
        isRead: false,
      }),
    ]);

    return successResponse(res, 200, 'Notifications retrieved successfully', {
      notifications,
      total,
      unreadCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('[notificationController.getNotifications]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/v1/notifications/unread-count
 * Quick lightweight query for navbar badge polling.
 */
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      $or: [{ recipient: req.user.id }, { recipientId: req.user.id }],
      isRead: false,
    });

    return successResponse(res, 200, 'Unread count retrieved', { unreadCount });
  } catch (error) {
    console.error('[notificationController.getUnreadCount]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a single notification as read (with strict ownership check).
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid notification ID');
    }

    const notification = await Notification.findById(id);

    // If not found or belongs to another user, return 404 to avoid ID enumeration
    if (!notification) {
      return errorResponse(res, 404, 'Not Found', 'Notification not found');
    }

    const ownerId = notification.recipient || notification.recipientId;
    if (ownerId.toString() !== req.user.id) {
      return errorResponse(res, 404, 'Not Found', 'Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    const remainingUnread = await Notification.countDocuments({
      $or: [{ recipient: req.user.id }, { recipientId: req.user.id }],
      isRead: false,
    });

    return successResponse(res, 200, 'Notification marked as read', {
      notification,
      unreadCount: remainingUnread,
    });
  } catch (error) {
    console.error('[notificationController.markAsRead]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 * Marks all notifications belonging to authenticated user as read.
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        $or: [{ recipient: req.user.id }, { recipientId: req.user.id }],
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    return successResponse(res, 200, 'All notifications marked as read', {
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    console.error('[notificationController.markAllAsRead]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

/**
 * DELETE /api/v1/notifications/:id
 * Allows authenticated user to delete only their own notification.
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Validation Error', 'Invalid notification ID');
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return errorResponse(res, 404, 'Not Found', 'Notification not found');
    }

    const ownerId = notification.recipient || notification.recipientId;
    if (ownerId.toString() !== req.user.id) {
      return errorResponse(res, 404, 'Not Found', 'Notification not found');
    }

    await Notification.deleteOne({ _id: id });

    return successResponse(res, 200, 'Notification deleted successfully', { id });
  } catch (error) {
    console.error('[notificationController.deleteNotification]', error);
    return errorResponse(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
