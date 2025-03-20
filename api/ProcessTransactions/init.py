import logging
import azure.functions as func
import pandas as pd
import json
from io import StringIO
from datetime import datetime
import tempfile
import os

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
    
    # Process each transaction
    for index, row in df.iterrows():
        date = row['Transaction Date']
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
        elif action == 'DIV':  # Dividend
            portfolio['cash'] += net_amount
        elif action == 'FXT':  # FX Transaction
            portfolio['cash'] += net_amount
        
        # Calculate position values using the transaction price
        position_values = {}
        for sym, qty in portfolio['positions'].items():
            if qty > 0:
                # Use the price from this transaction if it's for this symbol
                if sym == symbol and action in ['Buy', 'Sell']:
                    position_values[sym] = qty * price
                # Otherwise, use the last known price (simplified approach)
                else:
                    # Find the last transaction for this symbol
                    last_price = find_last_price(df, sym, date)
                    position_values[sym] = qty * last_price if last_price else 0
        
        # Record portfolio snapshot
        portfolio['history'].append({
            'date': date,
            'cash': portfolio['cash'],
            'positions': portfolio['positions'].copy(),
            'position_values': position_values,
            'total_value': portfolio['cash'] + sum(position_values.values())
        })
    
    return portfolio['history']

def find_last_price(df, symbol, current_date):
    """Find the last known price for a symbol before the current date."""
    symbol_txs = df[(df['Symbol'] == symbol) & 
                    (df['Action'].isin(['Buy', 'Sell'])) & 
                    (df['Transaction Date'] <= current_date)]
    
    if not symbol_txs.empty:
        last_tx = symbol_txs.iloc[-1]
        return float(last_tx['Price'])
    
    return None
