import "./App.css";
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
      <Container>
        <InputGroup>
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
              <Card.Img src={album.images[0]?.url} style={styles.albumImage} />
              <Card.Body>
                <Card.Title style={styles.albumTitle}>{album.name}</Card.Title>
                <Card.Text style={styles.albumText}>
                  Release Date: <br /> {album.release_date}
                </Card.Text>
                <Button
                  href={album.external_urls.spotify}
                  style={styles.albumLinkButton}
                >
                  Album Link
                </Button>
              </Card.Body>
            </Card>
          ))}
        </Row>
      </Container>
    </>
  );
}

export default App;


const styles = {
  searchInput: {
    width: 300,
    height: 35,
    border: 0,
    borderRadius: 5,
    marginRight: 10,
    paddingLeft: 10,
  },
  searchButton: {
    height: 35,
  },
  albumsRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignContent: "center",
  },
  albumCard: {
    backgroundColor: "white",
    margin: 10,
    marginBottom: 30,
    borderRadius: 5,
  },
  albumImage: {
    borderRadius: "4%",
    width: 200,
  },
  albumTitle: {
    whiteSpace: "wrap",
    fontWeight: "bold",
    maxWidth: 200,
    fontSize: 18,
    marginTop: 10,
    color: "black",
  },
  albumText: {
    color: "black",
  },
  albumLinkButton: {
    backgroundColor: "black",
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
    borderRadius: 5,
    padding: 10,
  },
};