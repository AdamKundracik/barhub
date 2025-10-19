import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
import PlaceFilterChip from './PlaceFilterChip';
import { Icons } from '../../../utils/icons/icons';
import { primaryColor } from '../../../utils/styles/colors';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { useUserStore } from '../../../utils/store/userStore';
import { favoriteService } from '../../../services/favoriteService';
import { useCustomToast } from '../../shared/Toaster';

interface HeaderProps {
  placeName: string | null;
}

const FeedHeader = ({ placeName }: HeaderProps) => {
  const { placeId, placeAddress } = usePlaceStore();
  const { getUserId } = useUserStore();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Check if place is favorite
  useEffect(() => {
    const checkFavorite = async () => {
      const userId = getUserId();
      
      if (!userId || !placeId) {
        setIsCheckingFavorite(false);
        return;
      }

      try {
        const favorite = await favoriteService.isFavorite(parseInt(userId, 10), placeId);
        setIsFavorite(favorite);
      } catch (error) {
        console.error('Error checking favorite:', error);
      } finally {
        setIsCheckingFavorite(false);
      }
    };

    if (placeId) {
      checkFavorite();
    } else {
      setIsCheckingFavorite(false);
      setIsFavorite(false);
    }
  }, [placeId, getUserId]);

  const handleToggleFavorite = async () => {
    const userId = getUserId();
    
    if (!userId || !placeId) {
      showErrorToast(t('error'), t('user-not-found'));
      return;
    }

    setIsTogglingFavorite(true);
    try {
      const result = await favoriteService.toggleFavorite(
        parseInt(userId, 10),
        placeId,
        placeName || '',
        placeAddress || '',
        isFavorite
      );

      if (result.success) {
        const newIsFavorite = result.isFavorite;
        setIsFavorite(newIsFavorite);
        
        // Optimistically update favorites cache for immediate UI update
        if (newIsFavorite) {
          // Add to favorites cache immediately
          queryClient.setQueryData(['userFavorites', userId], (oldData: any) => {
            if (!oldData) return oldData;
            if (!Array.isArray(oldData)) return oldData;
            
            // Check if already exists
            const exists = oldData.some((fav: any) => fav.placeId === placeId);
            if (exists) return oldData;
            
            // Add new favorite (from backend response or create locally)
            const newFavorite = result.favorite || {
              placeId,
              placeName: placeName || '',
              placeAddress: placeAddress || '',
              addedAt: new Date().toISOString(),
            };
            
            return [newFavorite, ...oldData];
          });
        } else {
          // Remove from favorites cache immediately
          queryClient.setQueryData(['userFavorites', userId], (oldData: any) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            return oldData.filter((fav: any) => fav.placeId !== placeId);
          });
        }
        
        // Also invalidate to refetch from server
        queryClient.invalidateQueries(['userFavorites']);
        
        showSuccessToast(
          newIsFavorite ? t('favorite-added') : t('favorite-removed'),
          ''
        );
      } else {
        showErrorToast(t('error'), result.message || t('something-went-wrong'));
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      showErrorToast(t('error'), t('something-went-wrong'));
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <>
      {placeName && placeId && (
        <View style={styles.headerContainer}>
          <PlaceFilterChip place={placeName} />
          
          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={isTogglingFavorite || isCheckingFavorite}
            activeOpacity={0.7}
          >
            {isTogglingFavorite || isCheckingFavorite ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <FontAwesomeIcon
                icon={isFavorite ? Icons.HeartSolid : Icons.Heart}
                size={24}
                color={isFavorite ? '#FF6B6B' : 'rgba(255, 255, 255, 0.6)'}
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingLeft: 16,
    paddingRight: 12,
  },
  favoriteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FeedHeader;
