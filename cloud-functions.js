// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Cloud function that runs daily at midnight (UTC) to clear chat messages
 * This maintains privacy by removing old messages
 */
exports.clearChatMessages = functions.pubsub
  .schedule('0 0 * * *') // Run every day at midnight UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const chatRef = db.collection('chatMessages');
      
      // Get all chat messages
      const chatSnapshot = await chatRef.get();
      
      // Delete in batches to avoid API limitations
      const batchSize = 500;
      const batches = [];
      
      // If there are no messages, return early
      if (chatSnapshot.empty) {
        console.log('No chat messages to delete');
        return null;
      }
      
      // Split documents into batches
      let batch = db.batch();
      let operationCount = 0;
      
      chatSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        operationCount++;
        
        if (operationCount === batchSize) {
          batches.push(batch);
          batch = db.batch();
          operationCount = 0;
        }
      });
      
      // Push any remaining operations
      if (operationCount > 0) {
        batches.push(batch);
      }
      
      // Commit all batches
      await Promise.all(batches.map((batch) => batch.commit()));
      
      console.log(`Cleared ${chatSnapshot.size} chat messages`);
      
      return null;
    } catch (error) {
      console.error('Error clearing chat messages:', error);
      return null;
    }
  });

/**
 * Cloud function that updates topic stats when a new tip is added or approved
 * This helps keep the topic card counters up-to-date
 */
exports.updateTopicStats = functions.firestore
  .document('tips/{tipId}')
  .onWrite(async (change, context) => {
    try {
      // Get the tip data
      const newValue = change.after.exists ? change.after.data() : null;
      const oldValue = change.before.exists ? change.before.data() : null;
      
      // If tip was deleted or doesn't contain topicId, exit
      if (!newValue || !newValue.topicId) {
        return null;
      }
      
      // Check if approval status changed
      const wasApproved = oldValue && oldValue.approved;
      const isApproved = newValue.approved;
      
      // Only update if a new tip was created or approval status changed
      if (!oldValue || wasApproved !== isApproved) {
        const db = admin.firestore();
        const topicId = newValue.topicId;
        
        // Get count of approved tips for this topic
        const tipsQuery = db.collection('tips')
          .where('topicId', '==', topicId)
          .where('approved', '==', true);
        
        const tipsSnapshot = await tipsQuery.get();
        const approvedTipsCount = tipsSnapshot.size;
        
        // Update topic document with stats
        const topicRef = db.collection('topics').doc(topicId);
        await topicRef.update({
          tipCount: approvedTipsCount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Updated stats for topic ${topicId}: ${approvedTipsCount} approved tips`);
      }
      
      return null;
    } catch (error) {
      console.error('Error updating topic stats:', error);
      return null;
    }
  });

/**
 * Cloud function that cleans up old rejected feedback after 30 days
 * This helps keep the database clean and reduces storage costs
 */
exports.cleanupRejectedFeedback = functions.pubsub
  .schedule('0 1 * * *') // Run every day at 1:00 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      
      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get all tips that might contain feedback
      const tipsSnapshot = await db.collection('tips')
        .where('approved', '==', true)
        .get();
      
      // Count of removed feedback items
      let removedCount = 0;
      
      // Process each tip
      const batch = db.batch();
      
      tipsSnapshot.docs.forEach((doc) => {
        const tipData = doc.data();
        
        // Skip if no feedback
        if (!tipData.feedback || !tipData.feedback.length) {
          return;
        }
        
        // Filter out old rejected feedback
        const updatedFeedback = tipData.feedback.filter((item) => {
          // Keep if not rejected or if created less than 30 days ago
          if (!item.rejectedAt) {
            return true;
          }
          
          const rejectedDate = item.rejectedAt.toDate ? 
            item.rejectedAt.toDate() : new Date(item.rejectedAt);
          
          const isOld = rejectedDate < thirtyDaysAgo;
          
          if (isOld) {
            removedCount++;
            return false;
          }
          
          return true;
        });
        
        // Update document if feedback changed
        if (updatedFeedback.length !== tipData.feedback.length) {
          batch.update(doc.ref, { feedback: updatedFeedback });
        }
      });
      
      // Commit batch if there are changes
      if (removedCount > 0) {
        await batch.commit();
        console.log(`Removed ${removedCount} old rejected feedback items`);
      } else {
        console.log('No old rejected feedback to remove');
      }
      
      return null;
    } catch (error) {
      console.error('Error cleaning up rejected feedback:', error);
      return null;
    }
  });
