import logging
import azure.functions as func
import pandas as pd
import json
from io import StringIO
from datetime import datetime
import numpy as np

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing transaction file')
    
    try:
        # Get the uploaded file
        file = req.files.get('file')
        if not file:
            return func.HttpResponse(
                "No file provided",
                status_code=400
            )
        
        # Read file content
        file_content = file.read().decode('utf-8')
        
        # Parse CSV into DataFrame
        df = pd.read_csv(StringIO(file_content))
        
        # Process transactions
        portfolio_history = process_transactions(df)
        
        # Convert dates to string format for JSON serialization
        for entry in portfolio_history:
            entry['date'] = entry['date'].strftime('%Y-%m-%d')
        
        return func.HttpResponse(
            json.dumps(portfolio_history),
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Error processing file: {str(e)}")
        return func.HttpResponse(
            f"Error processing file: {str(e)}",
            status_code=500
        )

def process_transactions(df):
    # Ensure date columns are datetime objects
    df['Transaction Date'] = pd.to_datetime(df['Transaction Date'])
    
    # Sort by transaction date
    df = df.sort_values('Transaction Date')
    
    # Initialize portfolio tracking
    portfolio = {
        'cash': 0,
        'positions': {},
        'history': []
    }
    
    # Create a date range that includes all transaction dates
    date_range = pd.date_range(
        start=df['Transaction Date'].min(),
        end=df['Transaction Date'].max(),
        freq='D'
    )
    
    # Track the latest prices for each symbol
    latest_prices = {}
    
    # Process each transaction first to build price history
    for index, row in df.iterrows():
        symbol = row['Symbol'] if pd.notna(row['Symbol']) else ''
        price = float(row['Price']) if pd.notna(row['Price']) else 0
        
        if symbol and price > 0 and row['Action'] in ['Buy', 'Sell']:
            latest_prices[symbol] = price
    
    # Process each date in the range
    prev_date = None
    for date in date_range:
        # Get transactions for this date
        day_transactions = df[df['Transaction Date'].dt.date == date.date()]
        
        # If there are transactions on this date, process them
        if not day_transactions.empty:
            for index, row in day_transactions.iterrows():
                action = row['Action']
                symbol = row['Symbol'] if pd.notna(row['Symbol']) else ''
                quantity = float(row['Quantity']) if pd.notna(row['Quantity']) else 0
                price = float(row['Price']) if pd.notna(row['Price']) else 0
                net_amount = float(row['Net Amount']) if pd.notna(row['Net Amount']) else 0
                
                # Update cash balance
                if action == 'CON':  # Contribution
                    portfolio['cash'] += abs(net_amount)
                elif action == 'WDR':  # Withdrawal
                    portfolio['cash'] -= abs(net_amount)
                elif action in ['Buy', 'Sell']:
                    portfolio['cash'] -= net_amount  # Net already includes sign
                    
                    # Update positions
                    if symbol not in portfolio['positions']:
                        portfolio['positions'][symbol] = 0
                        
                    if action == 'Buy':
                        portfolio['positions'][symbol] += quantity
                    elif action == 'Sell':
                        portfolio['positions'][symbol] -= quantity
                    
                    # Update latest price
                    if price > 0:
                        latest_prices[symbol] = price
                        
                elif action == 'DIV':  # Dividend
                    portfolio['cash'] += net_amount
                elif action == 'FXT':  # FX Transaction
                    portfolio['cash'] += net_amount
        
        # Calculate position values using the latest known prices
        position_values = {}
        for symbol, quantity in portfolio['positions'].items():
            if quantity > 0 and symbol in latest_prices:
                position_values[symbol] = quantity * latest_prices[symbol]
        
        # Only add to history if this is a new date or there were transactions
        if prev_date != date.date() or not day_transactions.empty:
            # Record portfolio snapshot
            portfolio['history'].append({
                'date': date,
                'cash': portfolio['cash'],
                'positions': portfolio['positions'].copy(),
                'position_values': position_values.copy(),
                'total_value': portfolio['cash'] + sum(position_values.values())
            })
            
        prev_date = date.date()
    
    return portfolio['history']
