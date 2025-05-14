# Template Generator Application

A web-based application that allows users to upload Excel files, process them using AI for schema generation, and create dynamic forms based on the generated schema. The application consists of a React frontend and a Node.js/Express backend.

## Features

- **Excel File Upload**: Upload Excel files for processing.
- **AI-Powered Schema Generation**: Automatically generate JSON schemas from Excel data using AI.
- **Schema Editor**: Edit the generated schema, including data types and field properties.
- **Dynamic Form Generation**: Create forms dynamically based on the schema using react-jsonschema-form.
- **Template Storage**: Save templates and component schemas in PostgreSQL.
- **Form Preview**: Test generated forms and templates.

## Tech Stack

### Frontend

- React with TypeScript
- Material-UI for UI components
- react-jsonschema-form for dynamic form rendering
- Axios for API calls

### Backend

- Node.js and Express with TypeScript
- PostgreSQL for data storage
- OpenAI for schema generation from Excel data
- Multer for file uploads

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/template-generator.git
cd template-generator
```

2. **Set up the database**

```bash
# Run the schema.sql script in your PostgreSQL database
psql -U postgres -d postgres -c "CREATE DATABASE template_generator"
psql -U postgres -d template_generator -f database/schema.sql
```

3. **Configure environment variables**

Create a `.env` file in the server directory:

```
PORT=3001
DB_USER=postgres
DB_HOST=localhost
DB_NAME=template_generator
DB_PASSWORD=your_password
DB_PORT=5432
OPENAI_API_KEY=your_openai_api_key
```

4. **Install dependencies and start the server**

```bash
# Install and start the backend
cd server
npm install
npm run dev

# In a new terminal, install and start the frontend
cd ../client
npm install
npm start
```

5. **Access the application**

Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload an Excel file**:

   - From the home page, upload your Excel file
   - The system will analyze the file and generate a schema

2. **Edit the schema**:

   - Modify the generated schema as needed
   - Change data types, add/remove fields, etc.

3. **Create dynamic form**:

   - Preview the form generated from your schema
   - Test the form by filling it out

4. **Save your template**:
   - Submit the form to save your template and schema
   - Access it later from the Templates page

## Project Structure

```
template-generator/
├── client/             # React frontend
│   ├── public/
│   │   ├── components/ # React components
│   │   ├── App.tsx     # Main application
│   │   └── ...
│   └── ...
├── server/             # Node.js/Express backend
│   ├── src/
│   │   ├── server.ts   # Express server setup
│   │   └── ...
│   └── ...
├── database/           # Database scripts and migrations
│   └── schema.sql      # Database schema
└── README.md           # This file
```

## License

This project is licensed under the MIT License.
