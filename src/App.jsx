import "./App.css";
import backgroundVideo from './assets/spotify.mp4';
import {
  FormControl,
  InputGroup,
  Container,
  Button,
  Card,
  Row,
  ButtonGroup,
  Dropdown,
} from "react-bootstrap";
import { useState, useEffect } from "react";
import { FaSearch, FaClock, FaFilter, FaTimes, FaMusic, FaUser, FaCompactDisc } from "react-icons/fa";
import AlbumModal from "./components/AlbumModal";
import AudioPlayer from "./components/AudioPlayer";

const clientId = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);
  const [searchType, setSearchType] = useState("artist");
  const [albumTypeFilter, setAlbumTypeFilter] = useState("all");
  const [decadeFilter, setDecadeFilter] = useState("all");
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const authParams = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    };

    fetch("https://accounts.spotify.com/api/token", authParams)
      .then((res) => res.json())
      .then((data) => setAccessToken(data.access_token))
      .catch((err) => setError("Failed to authenticate with Spotify"));

    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches");
      }
    }
  }, []);

  const saveRecentSearch = (term) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  async function search() {
    if (!searchInput.trim()) return;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const artistParams = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      };

      let artistID;
      if (searchType === "artist") {
        const artistResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${searchInput}&type=artist`,
          artistParams
        );
        const artistData = await artistResponse.json();
        artistID = artistData.artists?.items[0]?.id;
      } else if (searchType === "album") {
        const albumResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${searchInput}&type=album&limit=50`,
          artistParams
        );
        const albumData = await albumResponse.json();
        setAlbums(albumData.albums?.items || []);
        setLoading(false);
        saveRecentSearch(searchInput);
        return;
      } else {
        const trackResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${searchInput}&type=track&limit=50`,
          artistParams
        );
        const trackData = await trackResponse.json();
        setAlbums(trackData.tracks?.items || []);
        setLoading(false);
        saveRecentSearch(searchInput);
        return;
      }

      if (!artistID) {
        setError("No artist found. Please try a different search.");
        setAlbums([]);
        setLoading(false);
        return;
      }

      const albumsResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artistID}/albums?include_groups=album,single,compilation&market=US&limit=50`,
        artistParams
      );
      const albumsData = await albumsResponse.json();
      setAlbums(albumsData.items || []);
      saveRecentSearch(searchInput);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredAlbums = albums.filter((album) => {
    const year = album.release_date?.split("-")[0];
    const decade = year ? Math.floor(parseInt(year) / 10) * 10 : null;

    if (albumTypeFilter !== "all" && album.album_type !== albumTypeFilter) {
      return false;
    }
    if (decadeFilter !== "all" && decade !== parseInt(decadeFilter)) {
      return false;
    }
    return true;
  });

  const availableDecades = [...new Set(
    albums
      .map(a => a.release_date?.split("-")[0])
      .filter(Boolean)
      .map(y => Math.floor(parseInt(y) / 10) * 10)
  )].sort((a, b) => b - a);

  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
  };

  const closeModal = () => {
    setSelectedAlbum(null);
  };

  return (
    <>
      <video autoPlay muted loop style={styles.backGround}>
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div style={styles.overlay}></div>
      
      <div style={styles.mainWrapper}>
        {/* Header Section - Centered */}
        <div style={styles.headerSection}>
          <h1 style={styles.title}>🎵 Spotify Album Finder</h1>
          
          <div style={styles.searchTypeSelector}>
            <div style={styles.buttonGroup}>
              <Button
                variant={searchType === "artist" ? "success" : "outline-light"}
                onClick={() => setSearchType("artist")}
                style={styles.typeButton}
              >
                <FaUser /> Artist
              </Button>
              <Button
                variant={searchType === "album" ? "success" : "outline-light"}
                onClick={() => setSearchType("album")}
                style={styles.typeButton}
              >
                <FaCompactDisc /> Album
              </Button>
              <Button
                variant={searchType === "track" ? "success" : "outline-light"}
                onClick={() => setSearchType("track")}
                style={styles.typeButton}
              >
                <FaMusic /> Track
              </Button>
            </div>
          </div>

          <div style={styles.searchBox}>
            <InputGroup style={styles.inputGroup}>
              <FormControl
                placeholder={`Search For ${searchType.charAt(0).toUpperCase() + searchType.slice(1)}`}
                type="input"
                aria-label="Search"
                onKeyDown={(event) => {
                  if (event.key === "Enter") search();
                }}
                onChange={(event) => setSearchInput(event.target.value)}
                value={searchInput}
                style={styles.searchInput}
              />
              <Button onClick={search} style={styles.searchButton}>
                <FaSearch /> Search
              </Button>
            </InputGroup>
          </div>

          {recentSearches.length > 0 && (
            <div style={styles.recentSearches}>
              <div style={styles.recentHeader}>
                <FaClock style={{ marginRight: 8 }} />
                <span>Recent Searches</span>
                <button style={styles.clearButton} onClick={clearRecentSearches}>
                  <FaTimes /> Clear
                </button>
              </div>
              <div style={styles.recentChips}>
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    style={styles.chip}
                    onClick={() => {
                      setSearchInput(term);
                      search();
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters Section - Centered */}
        {hasSearched && (
          <div style={styles.filtersWrapper}>
            <div style={styles.filters}>
              <div style={styles.filterGroup}>
                <FaFilter style={{ marginRight: 8, color: "#b3b3b3" }} />
                <Dropdown>
                  <Dropdown.Toggle variant="outline-light" size="sm" style={styles.filterToggle}>
                    Type: {albumTypeFilter === "all" ? "All" : albumTypeFilter}
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={styles.dropdownMenu}>
                    <Dropdown.Item onClick={() => setAlbumTypeFilter("all")}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => setAlbumTypeFilter("album")}>Album</Dropdown.Item>
                    <Dropdown.Item onClick={() => setAlbumTypeFilter("single")}>Single</Dropdown.Item>
                    <Dropdown.Item onClick={() => setAlbumTypeFilter("compilation")}>Compilation</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                <Dropdown style={{ marginLeft: 10 }}>
                  <Dropdown.Toggle variant="outline-light" size="sm" style={styles.filterToggle}>
                    Decade: {decadeFilter === "all" ? "All" : `${decadeFilter}s`}
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={styles.dropdownMenu}>
                    <Dropdown.Item onClick={() => setDecadeFilter("all")}>All</Dropdown.Item>
                    {availableDecades.map((decade) => (
                      <Dropdown.Item key={decade} onClick={() => setDecadeFilter(decade.toString())}>
                        {decade}s
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <span style={styles.resultCount}>
                {filteredAlbums.length} {filteredAlbums.length === 1 ? "result" : "results"}
              </span>
            </div>
          </div>
        )}

        {/* Results Section - Centered */}
        <div style={styles.resultsContainer}>
          {loading && (
            <div style={styles.loadingContainer}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={styles.skeletonCard}>
                  <div className="skeleton-image"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error}</p>
              <Button variant="outline-light" onClick={search}>
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && filteredAlbums.length === 0 && hasSearched && (
            <div style={styles.noResults}>
              <p>No albums found. Try a different search or adjust filters.</p>
            </div>
          )}

          {!loading && !error && filteredAlbums.length > 0 && (
            <div style={styles.albumsGrid}>
              {filteredAlbums.map((album) => (
                <Card 
                  key={album.id} 
                  style={styles.albumCard}
                  onClick={() => handleAlbumClick(album)}
                  className="album-card"
                >
                  <div style={styles.albumImageContainer}>
                    <img 
                      src={album.images[0]?.url} 
                      style={styles.albumImage} 
                      alt={album.name}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
                    />
                  </div>
                  <div style={styles.albumInfo}>
                    <h3 style={styles.albumTitle}>{album.name}</h3>
                    <p style={styles.albumText}>{album.release_date?.split("-")[0]}</p>
                    <span style={styles.albumType}>{album.album_type}</span>
                  </div>
                  <div style={styles.controls}>
                    <a 
                      href={album.external_urls?.spotify} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={styles.playBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ▶
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAlbum && (
        <AlbumModal 
          album={selectedAlbum} 
          accessToken={accessToken} 
          onClose={closeModal}
        />
      )}

      {currentTrack && (
        <AudioPlayer 
          currentTrack={currentTrack}
          onTrackEnd={() => setCurrentTrack(null)}
        />
      )}
    </>
  );
}

export default App;

const styles = {
  backGround: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
    zIndex: -2,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: -1,
  },
  mainWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  headerSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
    paddingTop: 40,
  },
  title: {
    color: '#fff',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  searchTypeSelector: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: 15,
  },
  typeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 25px',
    width: 120,
  },
  searchBox: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  inputGroup: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
    maxWidth: 500,
  },
  searchInput: {
    width: '100%',
    maxWidth: 400,
    height: 45,
    border: '1px solid white',
    borderRadius: 25,
    paddingLeft: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    backdropFilter: 'blur(10px)',
  },
  searchButton: {
    borderRadius: 25,
    padding: '0 25px',
    backgroundColor: '#1DB954',
    border: 'none',
    fontWeight: 'bold',
    marginLeft: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recentSearches: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  recentHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#b3b3b3',
    marginBottom: 10,
    fontSize: '0.9rem',
  },
  clearButton: {
    background: 'transparent',
    border: 'none',
    color: '#b3b3b3',
    cursor: 'pointer',
    marginLeft: 15,
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  recentChips: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: '5px 15px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
  },
  filtersWrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  filters: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '15px 30px',
    borderRadius: 10,
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  filterToggle: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dropdownMenu: {
    backgroundColor: '#282828',
    border: 'none',
  },
  resultCount: {
    color: '#b3b3b3',
    fontSize: '0.9rem',
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 100,
    minHeight: '50vh',
  },
  loadingContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  skeletonCard: {
    backgroundColor: '#181818',
    margin: 15,
    width: 250,
    height: 350,
    borderRadius: 20,
    padding: 15,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    color: '#fff',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: '1.2rem',
    marginBottom: 20,
  },
  noResults: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    color: '#b3b3b3',
    fontSize: '1.1rem',
  },
  albumsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
    width: '100%',
    maxWidth: 1400,
  },
  albumCard: {
    backgroundColor: "#181818",
    margin: 15,
    width: 250,
    height: 380,
    borderRadius: 20,
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 15,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  albumImageContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  albumImage: {
    width: 180,
    height: 180,
    borderRadius: 8,
    objectFit: "cover",
  },
  albumInfo: {
    textAlign: "center",
    margin: "10px 0",
    flex: 0.8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  albumTitle: {
    fontWeight: "bold",
    fontSize: 16,
    margin: "5px 0",
    color: "white",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 200,
  },
  albumText: {
    fontSize: 12,
    color: "#b3b3b3",
    margin: 0,
  },
  albumType: {
    fontSize: 10,
    color: "#1DB954",
    backgroundColor: "rgba(29,185,84,0.2)",
    padding: "2px 8px",
    borderRadius: 10,
    marginTop: 5,
    textTransform: "capitalize",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: "auto",
  },
  playBtn: {
    backgroundColor: "#1DB954",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: 50,
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    textDecoration: "none",
    transition: "transform 0.2s",
  },
};

