import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoPlayerStatus, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useAppSelector } from '@/store/hooks';
import { getMaxContentWidth, useDeviceType } from '@/utils/useDeviceType';
import Feather from '@expo/vector-icons/Feather';

export default function AlertDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [playerStatus, setPlayerStatus] = useState<VideoPlayerStatus>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [useSecondarySource, setUseSecondarySource] = useState(true); // Start with Source 1 (secondaryVideoUrl)
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const sourceScrollRef = useRef<ScrollView>(null);
  const [sourceScrollIndex, setSourceScrollIndex] = useState(0);

  const alert = useAppSelector((state) =>
    state.alerts.items.find((item) => String(item.id) === String(id))
  );

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { isTablet, width } = useDeviceType();
  const maxContentWidth = getMaxContentWidth(isTablet);
  const SCREEN_WIDTH = width; // Use responsive width instead of static Dimensions

  // Bottom bar height: 15px + bottom safe area inset
  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Format date for header
  const formattedDate = useMemo(() => {
    if (!alert) return t('alerts.details.title');
    return new Date(alert.alertDate).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [alert, t]);

  const videoSource = useMemo(() => {
    if (!alert) return null;
    const uri = useSecondarySource
      ? alert.secondaryVideoUrl
      : alert.mainVideoUrl;
    // Ensure uri is a valid non-empty string to prevent iOS nil crash
    return uri && typeof uri === 'string' && uri.length > 0 ? { uri } : null;
  }, [alert, useSecondarySource]);

  const player = useVideoPlayer(videoSource, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.timeUpdateEventInterval = 0.25;
    if (videoSource) {
      playerInstance.play();
    }
  });

  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener('statusChange', ({ status }) => {
      setPlayerStatus(status);
      setIsLoading(status === 'loading');
    });

    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      setIsPlaying(isPlaying);
    });

    const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
      setCurrentTime(currentTime);
      setDuration(player.duration ?? 0);
    });

    const sourceSub = player.addListener('sourceChange', () => {
      setDuration(player.duration ?? 0);
      setCurrentTime(0);
      setIsLoading(true);
    });

    return () => {
      statusSub.remove();
      playingSub.remove();
      timeSub.remove();
      sourceSub.remove();
    };
  }, [player]);

  const isLoaded = playerStatus === 'readyToPlay';
  const progress = duration ? currentTime / duration : 0;

  const showLoading =
    (playerStatus === 'loading' || !isLoaded) && !isScrubbing && !isPlaying;

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Auto-hide controls after 3 seconds
  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isScrubbing) {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowControls(false);
        });
      }
    }, 3000);
  }, [controlsOpacity, isScrubbing]);

  const showControlsWithAnimation = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    hideControlsAfterDelay();
  }, [controlsOpacity, hideControlsAfterDelay]);

  const handleVideoPress = useCallback(() => {
    if (showControls) {
      // Hide controls
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowControls(false);
      });
      // Clear any pending timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      // Show controls
      showControlsWithAnimation();
    }
  }, [showControls, controlsOpacity, showControlsWithAnimation]);

  const handleSeek = useCallback(
    async (value: number) => {
      if (!player || !duration) return;
      setIsScrubbing(true);
      const newPosition = value * duration;
      player.currentTime = newPosition;
      setIsScrubbing(false);
    },
    [duration, player]
  );

  const togglePlayPause = useCallback(async () => {
    if (!player || !isLoaded) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    showControlsWithAnimation();
  }, [isLoaded, isPlaying, player, showControlsWithAnimation]);

  const skipBackward = useCallback(async () => {
    if (!player || !isLoaded) return;
    const newTime = Math.max(0, currentTime - 10);
    player.currentTime = newTime;
  }, [currentTime, isLoaded, player]);

  const skipForward = useCallback(async () => {
    if (!player || !isLoaded || !duration) return;
    const newTime = Math.min(duration, currentTime + 10);
    player.currentTime = newTime;
  }, [currentTime, duration, isLoaded, player]);

  const toggleVideoSource = useCallback(() => {
    if (!alert || !player) return;
    const hasSecondary = !!alert.secondaryVideoUrl;
    const hasMain = !!alert.mainVideoUrl;
    
    if (hasSecondary && hasMain) {
      const newUseSecondary = !useSecondarySource;
      const newUri = newUseSecondary
        ? alert.secondaryVideoUrl
        : alert.mainVideoUrl;
      
      // Ensure uri is a valid non-empty string to prevent iOS nil crash
      if (newUri && typeof newUri === 'string' && newUri.length > 0) {
        setUseSecondarySource(newUseSecondary);
        player.replace({ uri: newUri });
      }
    } else if (hasSecondary && !hasMain) {
      // Only secondary available, can't switch
      return;
    } else if (!hasSecondary && hasMain) {
      // Only main available, can't switch
      return;
    }
  }, [alert, useSecondarySource, player]);

  const currentSourceLabel = useMemo(() => {
    if (!alert) return '';
    if (useSecondarySource && alert.secondaryVideoUrl) {
      return t('alerts.details.source1');
    }
    if (!useSecondarySource && alert.mainVideoUrl) {
      return t('alerts.details.source2');
    }
    return '';
  }, [alert, useSecondarySource, t]);

  // Get available video sources
  const videoSources = useMemo(() => {
    if (!alert) return [];
    const sources: Array<{ uri: string; label: string }> = [];
    if (alert.secondaryVideoUrl) {
      sources.push({ uri: alert.secondaryVideoUrl, label: t('alerts.details.source1') });
    }
    if (alert.mainVideoUrl) {
      sources.push({ uri: alert.mainVideoUrl, label: t('alerts.details.source2') });
    }
    return sources;
  }, [alert, t]);

  const currentSourceIndex = useMemo(() => {
    if (!alert) return 0;
    if (useSecondarySource && alert.secondaryVideoUrl) return 0;
    if (!useSecondarySource && alert.mainVideoUrl) {
      return alert.secondaryVideoUrl ? 1 : 0;
    }
    return 0;
  }, [alert, useSecondarySource]);

  const canSwitchSource = useMemo(() => {
    if (!alert) return false;
    return !!(alert.secondaryVideoUrl && alert.mainVideoUrl);
  }, [alert]);

  const handleSourceChange = useCallback((index: number) => {
    if (!alert || !player) return;
    const source = videoSources[index];
    if (!source) return;
    
    const isSecondary = source.label === t('alerts.details.source1') && !!alert.secondaryVideoUrl;
    setUseSecondarySource(isSecondary);
    setSourceScrollIndex(index);
    
    // Update player source - ensure uri is valid to prevent iOS nil crash
    if (player && source?.uri && typeof source.uri === 'string' && source.uri.length > 0) {
      player.replace({ uri: source.uri });
      // Show controls when switching source
      showControlsWithAnimation();
    }
    
    if (sourceScrollRef.current) {
      sourceScrollRef.current.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [alert, videoSources, player, showControlsWithAnimation, t]);

  const handleSourceScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== sourceScrollIndex && index >= 0 && index < videoSources.length) {
      handleSourceChange(index);
    }
  }, [sourceScrollIndex, videoSources.length, handleSourceChange]);

  // Update scroll position when source changes externally
  useEffect(() => {
    if (sourceScrollRef.current && currentSourceIndex !== sourceScrollIndex) {
      sourceScrollRef.current.scrollTo({
        x: currentSourceIndex * SCREEN_WIDTH,
        animated: true,
      });
      setSourceScrollIndex(currentSourceIndex);
    }
  }, [currentSourceIndex, sourceScrollIndex]);

  // Initialize controls auto-hide
  useEffect(() => {
    if (isPlaying && !isScrubbing) {
      hideControlsAfterDelay();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isScrubbing, hideControlsAfterDelay]);

  if (!alert) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
      >
        <View style={[styles.topHeader, { paddingTop: insets.top + 5 }]}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('alerts.details.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{t('alerts.details.notFound')}</Text>
        </View>
        <BottomBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
    >
      {/* Header with back button */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 5 }]}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{formattedDate}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Video - Full width on all devices */}
        <View style={styles.videoContainer}>
          {videoSource && videoSources.length > 0 ? (
            <>
              {canSwitchSource ? (
                <ScrollView
                  ref={sourceScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleSourceScroll}
                  decelerationRate="fast"
                  snapToInterval={SCREEN_WIDTH}
                  snapToAlignment="center"
                  contentContainerStyle={styles.sourceScrollContent}
                >
                  {videoSources.map((source, index) => {
                    const isCurrentSource = index === currentSourceIndex;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={1}
                        onPress={handleVideoPress}
                        style={[styles.videoWrapper, { width: SCREEN_WIDTH }]}
                      >
                        {isCurrentSource ? (
                          <VideoView
                            style={styles.video}
                            player={player}
                            nativeControls={false}
                            contentFit="contain"
                            allowsFullscreen
                            allowsPictureInPicture
                            startsPictureInPictureAutomatically={false}
                            onFirstFrameRender={() => setIsLoading(false)}
                          />
                        ) : (
                          <View style={[styles.video, styles.videoPlaceholder]}>
                            <Feather name="video" size={48} color="rgba(255, 255, 255, 0.3)" />
                          </View>
                        )}
                        <View style={styles.sourceBadge}>
                          <Text style={styles.sourceBadgeText}>{source.label}</Text>
                        </View>
                        {showLoading && isCurrentSource && (
                          <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={BluePalette.merge} />
                          </View>
                        )}
                        
                        {/* Overlay Controls - always render but control visibility */}
                        {isCurrentSource && player && (
                          <Animated.View
                            style={[
                              styles.controlsOverlay,
                              { opacity: controlsOpacity }
                            ]}
                            pointerEvents="box-none"
                          >
                            {/* Invisible tap area to show controls */}
                            {!showControls && (
                              <Pressable
                                style={StyleSheet.absoluteFill}
                                onPress={showControlsWithAnimation}
                              />
                            )}
                            {/* Top gradient */}
                            <View style={styles.topGradient} />
                            
                            {/* Bottom gradient with controls */}
                            <View style={styles.bottomGradient}>
                              {/* Progress bar */}
                              <View style={styles.progressBarContainer}>
                                <Slider
                                  style={styles.progressSlider}
                                  minimumValue={0}
                                  maximumValue={1}
                                  value={progress}
                                  minimumTrackTintColor={BluePalette.merge}
                                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                  thumbTintColor={BluePalette.merge}
                                  onSlidingStart={() => {
                                    setIsScrubbing(true);
                                    showControlsWithAnimation();
                                  }}
                                  onSlidingComplete={handleSeek}
                                />
                              </View>

                              {/* Control buttons */}
                              <View style={styles.controlsRow}>
                                <View style={styles.controlsLeft}>
                                  <Pressable
                                    style={({ pressed }) => [
                                      styles.controlIconButton,
                                      pressed && styles.controlIconButtonPressed,
                                    ]}
                                    onPress={togglePlayPause}
                                  >
                                    <Feather
                                      name={isPlaying ? 'pause' : 'play'}
                                      size={20}
                                      color="#FFFFFF"
                                    />
                                  </Pressable>
                                  <Pressable
                                    style={({ pressed }) => [
                                      styles.controlIconButton,
                                      pressed && styles.controlIconButtonPressed,
                                    ]}
                                    onPress={skipBackward}
                                  >
                                    <Feather name="skip-back" size={18} color="#FFFFFF" />
                                  </Pressable>
                                  <Pressable
                                    style={({ pressed }) => [
                                      styles.controlIconButton,
                                      pressed && styles.controlIconButtonPressed,
                                    ]}
                                    onPress={skipForward}
                                  >
                                    <Feather name="skip-forward" size={18} color="#FFFFFF" />
                                  </Pressable>
                                </View>
                                
                                <View style={styles.timeContainer}>
                                  <Text style={styles.timeText}>
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleVideoPress}
                  style={[styles.videoWrapper, { width: SCREEN_WIDTH }]}
                >
                  <VideoView
                    style={styles.video}
                    player={player}
                    nativeControls={false}
                    contentFit="contain"
                    allowsFullscreen
                    allowsPictureInPicture
                    startsPictureInPictureAutomatically={false}
                    onFirstFrameRender={() => setIsLoading(false)}
                  />
                  {currentSourceLabel && (
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>{currentSourceLabel}</Text>
                    </View>
                  )}
                  {showLoading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color={BluePalette.merge} />
                    </View>
                  )}
                  
                  {/* Overlay Controls */}
                  {showControls && player && (
                    <Animated.View
                      style={[
                        styles.controlsOverlay,
                        { opacity: controlsOpacity }
                      ]}
                    >
                      <View style={styles.topGradient} />
                      <View style={styles.bottomGradient}>
                        <View style={styles.progressBarContainer}>
                          <Slider
                            style={styles.progressSlider}
                            minimumValue={0}
                            maximumValue={1}
                            value={progress}
                            minimumTrackTintColor={BluePalette.merge}
                            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                            thumbTintColor={BluePalette.merge}
                            onSlidingStart={() => {
                              setIsScrubbing(true);
                              showControlsWithAnimation();
                            }}
                            onSlidingComplete={handleSeek}
                          />
                        </View>
                        <View style={styles.controlsRow}>
                          <View style={styles.controlsLeft}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.controlIconButton,
                                pressed && styles.controlIconButtonPressed,
                              ]}
                              onPress={togglePlayPause}
                            >
                              <Feather
                                name={isPlaying ? 'pause' : 'play'}
                                size={20}
                                color="#FFFFFF"
                              />
                            </Pressable>
                            <Pressable
                              style={({ pressed }) => [
                                styles.controlIconButton,
                                pressed && styles.controlIconButtonPressed,
                              ]}
                              onPress={skipBackward}
                            >
                              <Feather name="skip-back" size={18} color="#FFFFFF" />
                            </Pressable>
                            <Pressable
                              style={({ pressed }) => [
                                styles.controlIconButton,
                                pressed && styles.controlIconButtonPressed,
                              ]}
                              onPress={skipForward}
                            >
                              <Feather name="skip-forward" size={18} color="#FFFFFF" />
                            </Pressable>
                          </View>
                          <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              )}

              {/* Pagination Dots */}
              {canSwitchSource && videoSources.length > 1 && (
                <View style={styles.paginationContainer}>
                  {videoSources.map((_, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSourceChange(index)}
                      style={styles.paginationDotWrapper}
                    >
                      <Animated.View
                        style={[
                          styles.paginationDot,
                          index === currentSourceIndex && styles.paginationDotActive,
                        ]}
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.videoWrapper, { width: SCREEN_WIDTH }]}>
              <View style={styles.noVideo}>
                <Feather name="video-off" size={48} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.noVideoMessage}>{t('alerts.details.noVideo')}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Details Section - Constrained on tablets */}
        <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
          <View style={styles.details}>
          <View style={styles.detailsHeader}>
            <Text style={styles.title}>{alert.productName || t('alerts.details.title')}</Text>
            <View style={styles.dateContainer}>
              <Feather name="calendar" size={14} color={BluePalette.textDark} />
              <Text style={styles.subtitle}>
                {new Date(alert.alertDate).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContent}>
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Feather name="info" size={16} color={BluePalette.merge} />
                <Text style={styles.detailCardLabel}>{t('alerts.details.status')}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.detailCardValue}>
                  {alert.humanJudgement || t('alerts.details.notAvailable')}
                </Text>
              </View>
            </View>

            {alert.humanJudgementComment ? (
              <View style={styles.detailCard}>
                <View style={styles.detailCardHeader}>
                  <Feather name="message-circle" size={16} color={BluePalette.merge} />
                  <Text style={styles.detailCardLabel}>{t('alerts.details.comment')}</Text>
                </View>
                <Text style={styles.commentText}>
                  {alert.humanJudgementComment}
                </Text>
              </View>
            ) : null}
          </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Bar */}
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: BluePalette.backgroundNew,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  videoContainer: {
    width: '100%',
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 0,
    overflow: 'hidden',
  },
  sourceScrollContent: {
    alignItems: 'center',
  },
  videoWrapper: {
    // Don't set width here - it's set dynamically inline
    aspectRatio: 16/9,
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 10,
  },
  sourceBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  topGradient: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // height: 100,
    // backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  progressBarContainer: {
    marginBottom: 0,
  },
  progressSlider: {
    width: '100%',
    height: 30,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlIconButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ scale: 0.95 }],
  },
  timeContainer: {
    paddingHorizontal: 8,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: BluePalette.backgroundNew,
  },
  paginationDotWrapper: {
    padding: 4,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: BluePalette.merge,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BluePalette.overlayLight,
  },
  noVideo: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#000',
  },
  details: {
    padding: 20,
    gap: 20,
    backgroundColor: BluePalette.white,
  },
  detailsHeader: {
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    fontSize: 15,
    color: BluePalette.textDark,
    fontWeight: '500',
    opacity: 0.7,
  },
  detailsContent: {
    gap: 14,
  },
  detailCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BluePalette.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusBadge: {
    backgroundColor: BluePalette.selectedBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: BluePalette.merge,
  },
  detailCardValue: {
    fontSize: 15,
    color: BluePalette.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  commentText: {
    fontSize: 15,
    color: BluePalette.textDark,
    fontWeight: '400',
    lineHeight: 22,
    opacity: 0.8,
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: BluePalette.textDark,
    fontSize: 16,
    marginTop: 12,
  },
  noVideoMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
});

