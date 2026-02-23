import { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { FaPlay, FaPause, FaExternalLinkAlt, FaTimes } from "react-icons/fa";

const AlbumModal = ({ album, accessToken, onClose }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (album && accessToken) {
      fetchAlbumTracks();
    }
  }, [album, accessToken]);

  useEffect(() => {
    return () => {
      if (currentPreview) {
        currentPreview.pause();
        setCurrentPreview(null);
      }
    };
  }, []);

  const fetchAlbumTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/albums/${album.id}/tracks?market=US`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch tracks");
      const data = await response.json();
      setTracks(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };

  const togglePlayPreview = (track) => {
    if (currentPreview) {
      currentPreview.pause();
      if (currentPreview.src === track.preview_url) {
        setCurrentPreview(null);
        setPlaying(false);
        return;
      }
    }
    if (track.preview_url) {
      const audio = new Audio(track.preview_url);
      audio.volume = 0.5;
      audio.play();
      setCurrentPreview(audio);
      setPlaying(true);
      audio.onended = () => {
        setPlaying(false);
        setCurrentPreview(null);
      };
    }
  };

  const handleClose = () => {
    if (currentPreview) {
      currentPreview.pause();
    }
    onClose();
  };

  const totalDuration = tracks.reduce((acc, track) => acc + track.duration_ms, 0);

  return (
    <Modal show={!!album} onHide={handleClose} size="lg" centered className="album-modal">
      <Modal.Header style={styles.header}>
        <div style={styles.headerContent}>
          <img
            src={album?.images[0]?.url}
            alt={album?.name}
            style={styles.albumCover}
          />
          <div style={styles.headerText}>
            <h2 style={styles.albumTitle}>{album?.name}</h2>
            <p style={styles.albumMeta}>
              {album?.artists?.map((a) => a.name).join(", ")} • {album?.release_date?.split("-")[0]}
            </p>
            <p style={styles.trackCount}>
              {tracks.length} tracks • {formatDuration(totalDuration)}
            </p>
          </div>
        </div>
        <button style={styles.closeButton} onClick={handleClose}>
          <FaTimes />
        </button>
      </Modal.Header>

      <Modal.Body style={styles.body}>
        {loading && (
          <div style={styles.loadingContainer}>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        )}

        {error && (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
            <Button variant="outline-light" size="sm" onClick={fetchAlbumTracks}>
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div style={styles.trackList}>
            {tracks.map((track, index) => (
              <div key={track.id} style={styles.trackItem}>
                <span style={styles.trackNumber}>{index + 1}</span>
                <div style={styles.trackInfo}>
                  <span style={styles.trackName}>{track.name}</span>
                  <span style={styles.trackArtists}>
                    {track.artists.map((a) => a.name).join(", ")}
                  </span>
                </div>
                <span style={styles.trackDuration}>{formatDuration(track.duration_ms)}</span>
                {track.preview_url && (
                  <button
                    style={styles.previewButton}
                    onClick={() => togglePlayPreview(track)}
                  >
                    {currentPreview?.src === track.preview_url && playing ? (
                      <FaPause />
                    ) : (
                      <FaPlay />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={styles.footer}>
        <a
          href={album?.external_urls?.spotify}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.spotifyLink}
        >
          Open in Spotify <FaExternalLinkAlt />
        </a>
      </Modal.Footer>
    </Modal>
  );
};

const styles = {
  header: {
    backgroundColor: "#181818",
    borderBottom: "1px solid #282828",
    padding: "20px",
    position: "relative",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  albumCover: {
    width: 120,
    height: 120,
    borderRadius: 8,
    objectFit: "cover",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  headerText: {
    flex: 1,
  },
  albumTitle: {
    color: "#fff",
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  albumMeta: {
    color: "#b3b3b3",
    marginBottom: "4px",
    fontSize: "0.9rem",
  },
  trackCount: {
    color: "#b3b3b3",
    fontSize: "0.85rem",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    background: "transparent",
    border: "none",
    color: "#b3b3b3",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: 5,
  },
  body: {
    backgroundColor: "#181818",
    maxHeight: "60vh",
    overflowY: "auto",
  },
  loadingContainer: {
    padding: "20px",
  },
  errorContainer: {
    padding: "40px",
    textAlign: "center",
  },
  errorText: {
    color: "#e74c3c",
    marginBottom: "15px",
  },
  trackList: {
    display: "flex",
    flexDirection: "column",
  },
  trackItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid #282828",
    transition: "background-color 0.2s",
  },
  trackNumber: {
    color: "#b3b3b3",
    width: 30,
    fontSize: "0.9rem",
  },
  trackInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  trackName: {
    color: "#fff",
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  trackArtists: {
    color: "#b3b3b3",
    fontSize: "0.8rem",
    marginTop: 2,
  },
  trackDuration: {
    color: "#b3b3b3",
    fontSize: "0.85rem",
    marginRight: 15,
    width: 45,
    textAlign: "right",
  },
  previewButton: {
    backgroundColor: "#1DB954",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.8rem",
    transition: "transform 0.2s",
  },
  footer: {
    backgroundColor: "#181818",
    borderTop: "1px solid #282828",
    justifyContent: "center",
  },
  spotifyLink: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#1DB954",
    textDecoration: "none",
    fontSize: "0.9rem",
    transition: "opacity 0.2s",
  },
};

export default AlbumModal;

