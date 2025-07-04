import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Skeleton,
  CircularProgress
} from '@mui/material';
import {
  Close,
  NavigateBefore,
  NavigateNext,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight
} from '@mui/icons-material';

interface MediaItem {
  _id: string;
  url: string;
  type: 'image' | 'video';
  alt?: string;
  caption?: string;
}

interface MediaViewerProps {
  open: boolean;
  onClose: () => void;
  media: MediaItem[];
  initialIndex?: number;
  showNavigation?: boolean;
  showControls?: boolean;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  open,
  onClose,
  media,
  initialIndex = 0,
  showNavigation = true,
  showControls = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentMedia = media[currentIndex];

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setLoading(true);
      setError(null);
      setZoom(1);
      setRotation(0);
      setIsPlaying(false);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case ' ':
          event.preventDefault();
          if (currentMedia?.type === 'video') {
            togglePlay();
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, currentMedia, isPlaying]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setLoading(true);
      setZoom(1);
      setRotation(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setLoading(true);
      setZoom(1);
      setRotation(0);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setLoading(false);
    setError('Failed to load image');
  };

  const handleVideoLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleVideoError = () => {
    setLoading(false);
    setError('Failed to load video');
  };

  const renderMedia = () => {
    if (!currentMedia) return null;

    const mediaStyle = {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain' as const,
      transform: `scale(${zoom}) rotate(${rotation}deg)`,
      transition: 'transform 0.3s ease-in-out'
    };

    if (currentMedia.type === 'image') {
      return (
        <img
          src={currentMedia.url}
          alt={currentMedia.alt || 'Media content'}
          style={mediaStyle}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      );
    } else if (currentMedia.type === 'video') {
      return (
        <video
          src={currentMedia.url}
          style={mediaStyle}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          controls={false}
          muted={isMuted}
          autoPlay={isPlaying}
          loop
        />
      );
    }

    return null;
  };

  const renderControls = () => {
    if (!showControls || !currentMedia) return null;

    return (
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderRadius: 2,
          p: 1
        }}
      >
        {currentMedia.type === 'video' && (
          <>
            <IconButton
              size="small"
              onClick={togglePlay}
              sx={{ color: 'white' }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            <IconButton
              size="small"
              onClick={toggleMute}
              sx={{ color: 'white' }}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </>
        )}

        <IconButton
          size="small"
          onClick={handleZoomOut}
          sx={{ color: 'white' }}
        >
          <ZoomOut />
        </IconButton>

        <IconButton
          size="small"
          onClick={handleZoomIn}
          sx={{ color: 'white' }}
        >
          <ZoomIn />
        </IconButton>

        <IconButton
          size="small"
          onClick={handleRotate}
          sx={{ color: 'white' }}
        >
          <RotateRight />
        </IconButton>

        <IconButton
          size="small"
          onClick={toggleFullscreen}
          sx={{ color: 'white' }}
        >
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
          m: 0,
          borderRadius: isFullscreen ? 0 : 2
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="white">
              {currentIndex + 1} of {media.length}
            </Typography>
            {currentMedia?.caption && (
              <Chip
                label={currentMedia.caption}
                size="small"
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            )}
          </Box>

          <IconButton
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Navigation Buttons */}
        {showNavigation && media.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                '&:disabled': { opacity: 0.3 }
              }}
            >
              <NavigateBefore />
            </IconButton>

            <IconButton
              onClick={handleNext}
              disabled={currentIndex === media.length - 1}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                '&:disabled': { opacity: 0.3 }
              }}
            >
              <NavigateNext />
            </IconButton>
          </>
        )}

        {/* Media Content */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            p: 4
          }}
        >
          {loading && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <CircularProgress color="primary" />
              <Typography variant="body2" color="white">
                Loading...
              </Typography>
            </Box>
          )}

          {error && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography variant="h6" color="error">
                {error}
              </Typography>
              <Typography variant="body2" color="white">
                Failed to load media
              </Typography>
            </Box>
          )}

          {!loading && !error && renderMedia()}
        </Box>

        {/* Controls */}
        {renderControls()}
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer; 