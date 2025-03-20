# Portfolio Visualizer

## Overview
Portfolio Visualizer is a web application that allows users to upload their investment transaction history (CSV format) and visualize their portfolio growth over time. The application processes transaction data and generates interactive charts showing how asset values and cash positions have changed.

## Features
- CSV file upload for transaction history
- Visualization of portfolio growth over time
- Tracking of individual asset positions
- Cash balance tracking
- Interactive chart with date-based timeline

## Usage
1. Click "Choose File" to select your transaction history CSV file
2. Click "Visualize Portfolio" to generate the chart
3. Hover over the chart to see values at specific dates

## Data Format
The application expects a CSV file with the following columns:
- Transaction Date
- Settlement Date
- Action (Buy, Sell, CON, DIV, etc.)
- Symbol
- Description
- Quantity
- Price
- Gross Amount
- Commission
- Net Amount
- Currency
- Activity Type

## Technical Details
- Frontend: React with Chart.js for visualization
- Backend: Azure Functions with Python for data processing
- Hosting: Azure Static Web Apps

## Current Limitations
- Currently only displaying cash values as a stacked area chart
- Future updates will include proper visualization of individual asset positions

## License
© 2025 Portfolio Visualizer
