import { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaVolumeUp, FaVolumeMute } from "react-icons/fa";

const AudioPlayer = ({ currentTrack, onTrackEnd }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (currentTrack?.preview_url && audioRef.current) {
      audioRef.current.src = currentTrack.preview_url;
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log("Playback failed:", err));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onTrackEnd) onTrackEnd();
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onTrackEnd]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <div style={styles.playerContainer}>
      <audio ref={audioRef} preload="metadata" />
      
      <div style={styles.trackInfo}>
        <img
          src={currentTrack.album?.images?.[2]?.url || currentTrack.album?.images?.[0]?.url}
          alt={currentTrack.name}
          style={styles.trackImage}
        />
        <div style={styles.trackDetails}>
          <span style={styles.trackName}>{currentTrack.name}</span>
          <span style={styles.trackArtist}>
            {currentTrack.artists?.map(a => a.name).join(", ")}
          </span>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.buttons}>
          <button style={styles.controlButton} disabled>
            <FaStepBackward />
          </button>
          <button style={styles.playButton} onClick={togglePlay}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button style={styles.controlButton} disabled>
            <FaStepForward />
          </button>
        </div>
        
        <div style={styles.progressContainer}>
          <span style={styles.time}>{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            style={styles.progressBar}
          />
          <span style={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>

      <div style={styles.volumeContainer}>
        <button style={styles.volumeButton} onClick={toggleMute}>
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          style={styles.volumeBar}
        />
      </div>
    </div>
  );
};

const styles = {
  playerContainer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#181818",
    borderTop: "1px solid #282828",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
  },
  trackInfo: {
    display: "flex",
    alignItems: "center",
    width: "25%",
    minWidth: 180,
  },
  trackImage: {
    width: 56,
    height: 56,
    borderRadius: 4,
    objectFit: "cover",
    marginRight: 12,
  },
  trackDetails: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  trackName: {
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  trackArtist: {
    color: "#b3b3b3",
    fontSize: "0.75rem",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "50%",
    maxWidth: 600,
  },
  buttons: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 8,
  },
  controlButton: {
    background: "transparent",
    border: "none",
    color: "#b3b3b3",
    fontSize: "1rem",
    cursor: "pointer",
    opacity: 0.7,
    padding: 5,
  },
  playButton: {
    backgroundColor: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  time: {
    color: "#b3b3b3",
    fontSize: "0.7rem",
    minWidth: 35,
  },
  progressBar: {
    flex: 1,
    height: 4,
    cursor: "pointer",
    accentColor: "#1DB954",
  },
  volumeContainer: {
    display: "flex",
    alignItems: "center",
    width: "25%",
    justifyContent: "flex-end",
    gap: 10,
  },
  volumeButton: {
    background: "transparent",
    border: "none",
    color: "#b3b3b3",
    fontSize: "0.9rem",
    cursor: "pointer",
    padding: 5,
  },
  volumeBar: {
    width: 100,
    height: 4,
    cursor: "pointer",
    accentColor: "#b3b3b3",
  },
};

export default AudioPlayer;

