import express, { Express, Request, Response } from "express";
import bodyparse from "body-parser";
import dotenv from "dotenv";
import queryString from "query-string";
import cors from "cors";
import { fileURLToPath } from "url";
import request from "request";

// Load .env file
dotenv.configDotenv();

const port = process.env.PORT;
const client_id = process.env.CLIENT_ID ?? '';
const client_secret = process.env.CLIENT_SECRET ?? '';
const redirect_uri: string = "http://localhost:3000/callback";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Create express server app
const app: Express = express();

app.set("view engine", "ejs");
app.set("views", "./views");

app
  .use(bodyparse.urlencoded({ extended: true }))
  .use(express.static(__dirname + "/public"))
  .use(cors());

function generateRandomString(randomLength: number): string {
  const randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let generatedString = "";
  for (let index = 0; index < randomLength; index++) {
    generatedString += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return generatedString;
}

async function generateCodeChallenge(codeVerifier: string) {
  function base64encode(value: ArrayBuffer) {
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(value)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const encoder: TextEncoder = new TextEncoder();
  const data: Uint8Array = encoder.encode(codeVerifier);
  if (typeof window !== "undefined") {
    const digest: ArrayBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return base64encode(digest);
  } else {
    return "";
  }
}

const codeVerifier: string = generateRandomString(128);

generateCodeChallenge(codeVerifier).then(codeChallenge => {
  let state = generateRandomString(16);
  let scope = 'user-read-private user-read-email';

  if (typeof localStorage !== "undefined") {
    localStorage.setItem('code_verifier', codeVerifier);
  }

  let args = new URLSearchParams({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  }).toString();

  if (typeof window !== "undefined") {
    window.location.href = 'https://accounts.spotify.com/authorize?' + args;
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');
  }
});

async function getProfile(accessToken: string) {
  let access_token: string = localStorage.getItem('access_token') ?? "";

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + access_token
    }
  });

  const data = await response.json();
  return data;
}

app.get("/login", function (req: Request, res: Response) {
  var state = generateRandomString(16);
  var scope = "user-read-private user-read-email";

  // request authorization
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
    queryString.stringify({
      response_type: "code",
      client_id: client_id,
      redirect_uri: redirect_uri,
      scope: scope,
      state: state,
    })
  );
});

app.get("/callback", async function (req: Request, res: Response) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  
  if (state === null) {
    res.redirect(
      "/#" +
      queryString.stringify({
        error: "state_mismatch",
      })
    );
  } else {
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(
      authOptions,
      function (error: Error, response: request.Response, body) {
        console.log(response.statusMessage);

        if (!error && response.statusCode === 200) {
          const access_token: string = body.access_token;
          const refresh_token: string = body.refresh_token;

          var options: request.CoreOptions = {
            headers: { Authorization: "Bearer " + access_token },
            json: true,
          };

          // use the access token to access the Spotify Web API
          request.get(
            "https://api.spotify.com/v1/me",
            options,
            function (error, response, body) {
              console.log(response.statusMessage);

              if (error || response.statusCode !== 200) {
                console.log(error);
              }
            }
          );

          // we can also pass the token to the browser to make requests from there
          res.redirect(
            "/#" +
            queryString.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            })
          );
        } else {
          res.redirect(
            "/#" +
            queryString.stringify({
              error: "invalid_token",
            })
          );
        }
      }
    );
  }
});

app.get("/refresh_token", async function (req: Request, res: Response) {
  var refresh_token = req.query.refresh_token;
  var authOptions: request.CoreOptions = {
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };
  request.post(
    "https://accounts.spotify.com/api/token",
    authOptions,
    function (error: Error, response: request.Response) {
      console.log(`{statusCode:${response.statusCode}, statusMessage:${response.statusMessage}}`);
      if (!error && response.statusCode === 200) {
        console.log("Success get refresh token");
      } else {
        console.log(`Rerresh token Error: ${error}`);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running at port:${port}`);
});
