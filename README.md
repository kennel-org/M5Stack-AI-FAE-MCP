# M5Stack AI FAE MCP

M5Stack AI FAE (Field Application Engineer) automation tool using Playwright. This project automates interactions with the M5 AI chat interface to retrieve technical information for M5Stack application development.

## Project Structure

```
M5Stack_AI_FAE_MCP/
├── doc/                    # Documentation
│   ├── m5ai_mcp.md         # Detailed guide for M5 AI automation
│   └── requirements_ja.md  # Requirements specification
├── test/                   # Test code
│   ├── fixtures/           # Test fixtures
│   │   └── m5ai-fixture.js # Japanese browser settings and fixtures
│   ├── logs/               # Log storage
│   ├── reports/            # Test reports
│   │   ├── html-report/    # HTML format reports
│   │   └── test-results/   # Test results (screenshots, etc.)
│   ├── specs/              # Test specifications
│   │   └── m5ai.spec.js    # M5 AI FAE interaction test
│   └── utils/              # Utility functions
│       ├── logger.js       # Logging utilities
│       └── m5ai-helper.js  # M5 AI FAE interaction helpers
├── package.json            # Project configuration
├── playwright.config.js    # Playwright configuration
└── README.md               # This file
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npm run playwright:install
   ```

3. **Install Playwright system dependencies**:
   ```bash
   npm run playwright:install-deps
   ```

## Usage

**Run the test**:
```bash
npm test
```

## Features

- Automated interaction with M5 AI chat interface
- Handles both Japanese and English interfaces
- Captures screenshots at various stages
- Extracts and saves response text, HTML, and structured data
- Supports following up on suggested questions
- Timestamps all output files to preserve previous results

## Documentation

For detailed information about how to use and extend this project, please refer to the documentation in the `doc` directory:

- [M5 AI MCP Guide](doc/m5ai_mcp.md) - Detailed guide for M5 AI automation
- [Requirements (Japanese)](doc/requirements_ja.md) - Requirements specification

## Output Files

All output files are saved to the `test/logs` directory with timestamps to prevent overwriting previous results:

- Screenshots (PNG)
- Response text (TXT)
- Response HTML (HTML)
- Bot messages (JSON)

## License

This project is proprietary and confidential.
