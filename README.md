# PDF-Extractor

Automated tool for extracting key data from PDF documents. Parses uploaded PDF files and extracts structured data using regex patterns for further processing in business workflows.

## Features

- PDF parsing via API endpoint
- Structured data extraction using customizable regex patterns
- Returns data formatted for automated processing
- Serverless deployment ready

## Technologies

- **JavaScript** - Core logic
- **pdf-parse** - PDF text extraction
- **Vercel** - Serverless deployment

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd pdf-extractor
```

2. Install dependencies:
```bash
npm install
```

3. Deploy to Vercel:
```bash
vercel deploy
```

## Usage

### API Endpoint

Send POST request to `/api/extract`

**Request:**
```json
{
  "pdfData": "base64_encoded_pdf_string"
}
```

**Response:**
```json
{
  "success": true,
  "result": "price|ipn|policy_number",
  "details": {
    "price": "1000",
    "ipn": "1234567890",
    "policy_number": "123456789"
  }
}
```

## Customization

### Modify Extraction Patterns

Edit `extract.js` to customize regex patterns for your specific document format:

```javascript
// Example: Extract policy number
const policyMatch = fullText.match(/Policy\s*№\s*(\d{9})/);

// Example: Extract client ID
const idMatch = fullText.match(/ID[^\d]*(\d{10})/);
```

### Add New Fields

1. Create new regex pattern in `extract.js`
2. Add field to response object
3. Update result format as needed

### Change Output Format

Modify the result formatting in `extract.js`:

```javascript
// Current format: price|ipn|policy_number
const result = `${price || ''}|${ipn || ''}|${policyNumber || ''}`;

// Custom format example:
const result = {
  price: price,
  client_id: ipn,
  policy: policyNumber
};
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `400` - Missing PDF data
- `405` - Method not allowed
- `500` - Processing error

## Example Usage

```javascript
// Frontend example
const pdfFile = document.getElementById('pdfFile').files[0];
const reader = new FileReader();

reader.onload = async function(e) {
  const base64 = e.target.result.split(',')[1];
  
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pdfData: base64 })
  });
  
  const result = await response.json();
  console.log(result);
};

reader.readAsDataURL(pdfFile);
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Test thoroughly
5. Submit pull request

## License

MIT License
