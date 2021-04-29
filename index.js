const { google } = require('googleapis');
const express = require('express')
const multer = require("multer");
const http = require("http");
const path = require("path");
const fs = require("fs");
const cors = require('cors');
const app = express()

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

/** Change this folder ID */
const folderId = '1qlF2dI4ciDh2omUrC8TTLrt34wVQTVbr';

const credentials = require('./credentials.json');
const scopes = [
  'https://www.googleapis.com/auth/drive'
];
const auth = new google.auth.JWT(
  credentials.client_email, null,
  credentials.private_key, scopes
);
const drive = google.drive({ version: "v3", auth });

app.get("/getAllFiles", async (request, response) => {
  try {
    let res = await drive.files.list({
      fields: 'files(size,driveId,name,fullFileExtension,thumbnailLink,webViewLink)',
      orderBy: 'name',
      pageSize: 1000
    });
    response.json(res.data);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

const handleError = (err, res) => {
  res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");
};

const upload = multer({
  dest: "/path/to/temporary/directory/to/store/uploaded/files"
});

/** TODO - Update the upload function for other file formats currently only .png */
app.post("/upload",  upload.single("file"), async (req, res) => {
    console.log(req.file)
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "./uploads/image.png");
    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
      fs.rename(tempPath, targetPath, err => {
        if (err) return handleError(err, res);
        drive.files.create({
          resource: {
            name: Math.random().toString(36).substr(2, 5),
            mimeType: "image/png",
            parents:[folderId]
          },
          media: {
            mimeType: "image/png",
            body: fs.createReadStream(targetPath)
          },
          fields: "name, webViewLink, id"
        });
        res
          .status(200)
          .contentType("application/json")
          .end("File uploaded!");
      });
    }
  }
);

if (process.env.NODE_ENV === "production") {
  app.use(express.static('web/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, "web", "build", "index.html"))
  })
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));