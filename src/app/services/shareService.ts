import { Platform, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Post } from '@/common/types/postTypes';

class ShareService {
  // Use custom scheme for DEV, web URL for PROD (without trailing slash)
  private readonly BASE_URL = __DEV__ ? 'barhub:/' : 'https://barhubapp.com';
  private readonly DEEP_LINK_SCHEME = 'barhub://';

  /**
   * Share a post using native share sheet
   */
  async sharePost(post: Post): Promise<void> {
    try {
      const shareUrl = this.getPostUrl(post.id);
      
      // iOS automatically appends the URL from 'url' property, so don't include it in message
      const messageWithUrl = this.buildShareMessage(post, shareUrl);
      const messageWithoutUrl = this.buildShareMessage(post, '');

      const result = await Share.share(
        {
          message: Platform.OS === 'ios' ? messageWithoutUrl : messageWithUrl,
          url: Platform.OS === 'ios' ? shareUrl : undefined,
          title: `${post.placeName} - Barhub`,
        },
        {
          dialogTitle: 'Share this post',
          subject: `Check out ${post.placeName} on Barhub`,
        }
      );

      if (result.action === Share.sharedAction) {
        console.log('[ShareService] Post shared successfully');
        // TODO: Track analytics event
        // await this.trackShare(post.id, result.activityType);
      } else if (result.action === Share.dismissedAction) {
        console.log('[ShareService] Share dismissed');
      }
    } catch (error) {
      console.error('[ShareService] Error sharing post:', error);
      throw error;
    }
  }

  /**
   * Copy post link to clipboard
   */
  async copyPostLink(postId: string): Promise<void> {
    try {
      const shareUrl = this.getPostUrl(postId);
      Clipboard.setString(shareUrl);
      console.log('[ShareService] Link copied to clipboard:', shareUrl);
    } catch (error) {
      console.error('[ShareService] Error copying link:', error);
      throw error;
    }
  }

  /**
   * Get deep link URL for a post (custom scheme)
   */
  getDeepLink(postId: string): string {
    return `${this.DEEP_LINK_SCHEME}post/${postId}`;
  }

  /**
   * Get URL for a post (environment-aware)
   * DEV: barhub://post/123
   * PROD: https://barhubapp.com/post/123
   */
  getPostUrl(postId: string): string {
    return `${this.BASE_URL}/post/${postId}`;
  }

  /**
   * Build a formatted share message
   */
  private buildShareMessage(post: Post, url: string): string {
    const occupancyEmoji = this.getOccupancyEmoji(post.occupancy);
    const timestamp = new Date(post.creationTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const authorName = post.user?.displayName || 'Unknown';

    const baseMessage = `📍 ${post.placeName}
${occupancyEmoji}
📸 Photo by ${authorName}
🕐 ${timestamp}

Check out this photo on Barhub!`;

    // Add URL only if provided (Android needs it in message, iOS adds it separately)
    return url ? `${baseMessage}\n${url}` : baseMessage;
  }

  /**
   * Get emoji representation of occupancy
   */
  private getOccupancyEmoji(occupancy: string): string {
    const emojiMap: Record<string, string> = {
      EMPTY: '🟢 Empty',
      MODERATE: '🟡 Moderate',
      ALMOST_FULL: '🟠 Almost Full',
      FULL: '🔴 Full',
    };
    return emojiMap[occupancy] || `📊 ${occupancy}`;
  }
}

export const shareService = new ShareService();
