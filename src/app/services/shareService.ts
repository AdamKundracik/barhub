import { Platform, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Post } from '@/common/types/postTypes';

class ShareService {
  private readonly BASE_URL = 'https://barhub.app';
  private readonly DEEP_LINK_SCHEME = 'barhub://';

  /**
   * Share a post using native share sheet
   */
  async sharePost(post: Post): Promise<void> {
    try {
      const shareUrl = this.getPostUrl(post.id);
      const message = this.buildShareMessage(post, shareUrl);

      const result = await Share.share(
        {
          message: Platform.OS === 'ios' ? message : message,
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
   * Get deep link URL for a post
   */
  getDeepLink(postId: string): string {
    return `${this.DEEP_LINK_SCHEME}post/${postId}`;
  }

  /**
   * Get web URL for a post
   */
  getPostUrl(postId: string): string {
    return `${this.BASE_URL}/post/${postId}`;
  }

  /**
   * Get short URL for a post (alternative format)
   */
  getShortUrl(postId: string): string {
    return `${this.BASE_URL}/p/${postId}`;
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

    return `📍 ${post.placeName}
${occupancyEmoji}
📸 Photo by ${authorName}
🕐 ${timestamp}

Check out this photo on Barhub!
${url}`;
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
