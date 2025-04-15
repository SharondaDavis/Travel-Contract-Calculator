# Travel Nurse AI Assistant

A privacy-focused, client-side application for travel nurses to analyze and compare contract offers. Built with modern web standards and designed to be interoperable with healthcare systems through SMART FHIR standards, this tool puts nurses in control of their contract data while maintaining complete privacy.

## Privacy & Security

- **100% Client-Side Operation**: All data is stored locally in your browser using Dexie.js (a wrapper for IndexedDB)
- **No Server Storage**: Your contract details never leave your device
- **Complete Data Ownership**: You maintain full control over your contract information
- **Local Processing**: All calculations and AI analysis happen on your device
- **Secure API Integration**: OpenAI API calls are made directly from your browser with your API key

## Standards & Interoperability

This application follows SMART FHIR standards to demonstrate how nurses can build interoperable applications that work seamlessly across healthcare systems. While this specific tool focuses on contract analysis, it serves as an example of how to:

- Implement standards-based data layers using FHIR API and resource definitions
- Build applications that can be integrated into various healthcare systems
- Create tools that follow healthcare interoperability standards
- Develop applications that maintain data privacy while being interoperable

The goal is to empower nurses to build applications that:
- Can run anywhere in the healthcare system
- Follow established healthcare standards
- Maintain data privacy and security
- Are easily integrated with other healthcare tools

## Features

### Implemented Features

- **Contract Management**
  - Add, edit, and delete travel nurse contracts
  - Store contract details including pay rates, stipends, and benefits
  - Export contracts to PDF for easy sharing
  - Import contracts from PDF files

- **AI-Powered Contract Analysis**
  - Interactive chat interface for contract analysis
  - Get instant insights about contract details
  - Compare contracts with AI assistance
  - Receive negotiation tips and recommendations
  - Analyze benefits packages and housing options
  - Calculate net income projections

- **User Experience**
  - Modern, responsive design
  - Intuitive contract comparison interface
  - Quick access to key contract details

### Planned Features

- **Financial Analysis**
  - Calculate weekly and total contract earnings
  - Compare multiple contracts side by side
  - Analyze tax implications and take-home pay
  - Track housing stipends and other benefits
  - Cost of living analysis
  - Transportation cost calculator
  - Tax implications estimation
  - Contract scoring system

- **Location Analysis**
  - Location-based insights
  - Compare cost of living between locations
  - Analyze transportation options and costs
  - Evaluate local amenities and quality of life

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/travel-contract-calculator.git
   cd travel-contract-calculator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Start the Express server (for OpenAI integration):
   ```bash
   node server.js
   ```

5. Open your browser and navigate to `http://localhost:3000`

### OpenAI Integration Setup

1. Get your OpenAI API key from [OpenAI's platform](https://platform.openai.com/api-keys)

2. Click the settings icon in the top-right corner of the application

3. Enter your OpenAI API key in the settings panel

4. The chat functionality will now be available to help analyze your contracts

## Usage

### Adding Contracts

1. Click the "Add Contract" button
2. Fill in the contract details:
   - Facility name and location
   - Contract dates
   - Pay rates (hourly, weekly, total)
   - Stipends (housing, meals, etc.)
   - Benefits information
3. Click "Save" to store the contract

### Comparing Contracts

1. Add multiple contracts to the system
2. Use the comparison view to see contracts side by side
3. The AI chat assistant can help analyze differences and provide insights

### Using the AI Chat Assistant

1. Click the chat icon in the top-right corner
2. Ask questions about your contracts, such as:
   - "Compare these contracts and highlight key differences"
   - "Calculate my potential net income after taxes"
   - "What are the housing options in these locations?"
   - "Which contract has better benefits?"
3. The AI will analyze your contracts and provide detailed responses

### Exporting Contracts (to-do)

1. Select the contracts you want to export
2. Click the "Export" button
3. Choose a location to save the PDF file

### Importing Contracts (to-do)

1. Click the "Import" button
2. Select a PDF file containing contract details
3. The system will parse the PDF and create a new contract entry

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- OpenAI API
- Express.js
- PDFKit
- pdf-parse
- Dexie.js (IndexedDB)

## Contributing

We welcome contributions! To ensure alignment and avoid duplicate work, please follow these steps:

1. **Open an issue first** to discuss new features or enhancements before submitting a PR. This helps us agree on scope and approach.
2. Fork the repository.
3. Create a new branch (`git checkout -b feature/your-feature`).
4. Commit your changes (`git commit -am 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature`).
6. Create a new Pull Request referencing the related issue.

Thank you for contributing! 💡

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- The travel nursing community for feedback and suggestions
- All contributors who have helped improve this tool
