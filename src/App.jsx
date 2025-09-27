import "./App.css";
import backgroundVideo from './assets/spotify.mp4';
import {
  FormControl,
  InputGroup,
  Container,
  Button,
  Card,
  Row,
} from "react-bootstrap";
import { useState, useEffect } from "react";

const clientId = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);

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
      .then((data) => setAccessToken(data.access_token));
  }, []);

  async function search() {
    const artistParams = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const artistID = await fetch(
      `https://api.spotify.com/v1/search?q=${searchInput}&type=artist`,
      artistParams
    )
      .then((res) => res.json())
      .then((data) => data.artists.items[0]?.id);

    if (!artistID) return;

    await fetch(
      `https://api.spotify.com/v1/artists/${artistID}/albums?include_groups=album&market=US&limit=50`,
      artistParams
    )
      .then((res) => res.json())
      .then((data) => setAlbums(data.items));
  }

  return (
    <>
      <video autoPlay muted loop style={styles.backGround}>
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <Container style={styles.searchContainer}>
        <InputGroup style={styles.inputGroup}>
          <FormControl
            placeholder="Search For Artist"
            type="input"
            aria-label="Search for an Artist"
            onKeyDown={(event) => {
              if (event.key === "Enter") search();
            }}
            onChange={(event) => setSearchInput(event.target.value)}
            style={styles.searchInput}
          />
          <Button onClick={search} style={styles.searchButton}>
            Search
          </Button>
        </InputGroup>
      </Container>

      <Container>
        <Row style={styles.albumsRow}>
          {albums.map((album) => (
            <Card key={album.id} style={styles.albumCard}>
              <div style={styles.albumImageContainer}>
                <img src={album.images[0]?.url} style={styles.albumImage} alt={album.name} />
              </div>
              <div style={styles.albumInfo}>
                <h3 style={styles.albumTitle}>{album.name}</h3>
                <p style={styles.albumText}>{album.release_date}</p>
              </div>
              <div style={styles.progressBar}>
                <div style={styles.progressFill}></div>
              </div>
              <div style={styles.controls}>
                <a href={album.external_urls.spotify} target="_blank" rel="noopener noreferrer" style={styles.playBtn}>
                  ▶
                </a>
              </div>
            </Card>
          ))}
        </Row>
      </Container>
    </>
  );
}

export default App;


const styles = {
  backGround:{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
    zIndex: -1,
  },
  searchInput: {
    width: 300,
    height: 35,
    border: '1px solid white',
    borderRadius: 5,
    marginRight: 10,
    paddingLeft: 10,
    backgroundColor: 'transparent',
    color: 'white',
  },
  searchButton: {
    height: 41,
  },
  albumsRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignContent: "center",
    padding: 20,
  },
  albumCard: {
    backgroundColor: "#181818",
    margin: 15,
    width: 250,
    height: 350,
    borderRadius: 20,
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 15,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
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
    flex: 0.5,
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
  progressBar: {
    width: "100%",
    height: "4px",
    backgroundColor: "#404040",
    borderRadius: "2px",
    margin: "10px 0",
    overflow: "hidden",
  },
  progressFill: {
    width: "50%",
    height: "100%",
    backgroundColor: "#1DB954",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: "10px",
  },
  linkText: {
    fontSize: 10,
    color: "#b3b3b3",
    margin: "5px 0",
    textAlign: "center",
    wordBreak: "break-all",
    maxWidth: "100%",
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
  }
};
