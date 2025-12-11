import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useVideoPlayer, VideoPlayerStatus, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAppSelector } from '@/store/hooks';
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

  const alert = useAppSelector((state) =>
    state.alerts.items.find((item) => String(item.id) === String(id))
  );

  const navigation = useNavigation();

  useLayoutEffect(() => {
    if (alert) {
      const formattedDate = new Date(alert.alertDate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      navigation.setOptions({
        title: formattedDate,
      });
    }
  }, [alert, navigation]);

  const videoSource = useMemo(() => {
    if (!alert) return null;
    const uri = useSecondarySource
      ? alert.secondaryVideoUrl
      : alert.mainVideoUrl;
    return uri ? { uri } : null;
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
  }, [isLoaded, isPlaying, player]);

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
      
      if (newUri) {
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
      return 'Source 1';
    }
    if (!useSecondarySource && alert.mainVideoUrl) {
      return 'Source 2';
    }
    return '';
  }, [alert, useSecondarySource]);

  const canSwitchSource = useMemo(() => {
    if (!alert) return false;
    return !!(alert.secondaryVideoUrl && alert.mainVideoUrl);
  }, [alert]);

  if (!alert) {
    return (
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        style={[styles.container, { backgroundColor: Colors.dark.background }]}
      >
        <View style={styles.messageContainer}>
          <Text style={styles.message}>Alert not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.container, { backgroundColor: Colors.dark.background }]}
    >
      <View style={styles.videoContainer}>
        {videoSource ? (
          <View style={styles.videoWrapper}>
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
            {currentSourceLabel ? (
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceBadgeText}>{currentSourceLabel}</Text>
              </View>
            ) : null}
            {canSwitchSource ? (
              <Pressable
                style={({ pressed }) => [
                  styles.sourceSwitchIcon,
                  pressed && styles.sourceSwitchIconPressed,
                ]}
                onPress={toggleVideoSource}
                hitSlop={8}
              >
                <Feather name="refresh-cw" size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
            {showLoading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.noVideo}>
            <Text style={styles.message}>No video available</Text>
          </View>
        )}
      </View>

      {player ? (
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.skipButtonPressed,
              ]}
              onPress={skipBackward}
            >
              <Feather name="rewind" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.playPauseButton,
                pressed && styles.playPauseButtonPressed,
              ]}
              onPress={togglePlayPause}
            >
              <Feather
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#FFFFFF"
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.skipButtonPressed,
              ]}
              onPress={skipForward}
            >
              <Feather name="fast-forward" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              minimumTrackTintColor="#2E7DDB"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="#FFFFFF"
              onSlidingStart={() => setIsScrubbing(true)}
              onSlidingComplete={handleSeek}
            />
            <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.details}>
        <View style={styles.detailsHeader}>
          <Text style={styles.title}>{alert.productName || 'Alert'}</Text>
          <Text style={styles.subtitle}>
            {new Date(alert.alertDate).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        </View>

        <View style={styles.detailsContent}>
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>Status</Text>
            <Text style={styles.detailCardValue}>
              {alert.humanJudgement || 'N/A'}
            </Text>
          </View>

          {alert.humanJudgementComment ? (
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>Comment</Text>
              <Text style={styles.detailCardValue}>
                {alert.humanJudgementComment}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16/10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  videoWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    
    aspectRatio: 16/9,
    flex: 1,
  },
  sourceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sourceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sourceSwitchIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  sourceSwitchIconPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  noVideo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  skipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  skipButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46,125,219,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(46,125,219,0.4)',
  },
  playPauseButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(46,125,219,0.35)',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slider: {
    flex: 1,
  },
  timeLabel: {
    width: 52,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontVariant: ['tabular-nums'],
  },
  details: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  detailsHeader: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  detailsContent: {
    gap: 12,
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  detailCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCardValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 22,
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: 'rgba(255,255,255,0.8)',
  },
});

