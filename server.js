const express = require('express');
const multer = require('multer');
const docxConverter = require('docx-pdf');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Serve the frontend HTML file from the 'public' directory
app.use(express.static('public'));

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        // Create uploads folder if it doesn't exist
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Give the file a unique name using the current timestamp
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API Endpoint to handle the conversion
app.post('/convert', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, 'uploads', `${Date.now()}.pdf`);

    // Convert DOCX to PDF
    docxConverter(inputPath, outputPath, (err, result) => {
        if (err) {
            console.error('Conversion Error:', err);
            return res.status(500).send('Error converting file.');
        }
        
        // Send the converted PDF back to the client
        res.download(outputPath, 'converted.pdf', (downloadErr) => {
            if (downloadErr) console.error('Download Error:', downloadErr);
            
            // Delete the temporary files from the server to save space
            try {
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
            } catch (cleanupErr) {
                console.error('Cleanup Error:', cleanupErr);
            }
        });
    });
});

app.listen(port, () => {
    console.log(`✅ Server is running! Open http://localhost:${port} in your browser.`);
});