import logging
import azure.functions as func
import pandas as pd
import json
from io import StringIO

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
        try:
            file_content = file.read().decode('utf-8')
            df = pd.read_csv(StringIO(file_content))
        except Exception as e:
            logging.error(f"Error reading CSV file: {str(e)}")
            return func.HttpResponse(
                "Error reading CSV file. Please ensure it is properly formatted.",
                status_code=400
            )
        
        # Validate required columns
        required_columns = ['Transaction Date', 'Settlement Date', 'Action', 'Symbol', 
                            'Description', 'Quantity', 'Price', 'Gross Amount', 
                            'Commission', 'Net Amount', 'Currency', 'Activity Type']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return func.HttpResponse(
                f"Missing required columns: {', '.join(missing_columns)}",
                status_code=400
            )
        
        # Process transactions
        portfolio_history, portfolio_summary = process_transactions(df)
        
        # Convert dates to string format for JSON serialization
        for entry in portfolio_history:
            entry['date'] = entry['date'].strftime('%Y-%m-%d')
        
        response_data = {
            "portfolio_history": portfolio_history,
            "portfolio_summary": portfolio_summary
        }
        
        return func.HttpResponse(
            json.dumps(response_data),
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return func.HttpResponse(
            f"Unexpected error occurred: {str(e)}",
            status_code=500
        )

def process_transactions(df):
    df['Transaction Date'] = pd.to_datetime(df['Transaction Date'])
    df = df.sort_values('Transaction Date')

    portfolio = {'cash': 0, 'positions': {}, 'history': []}
    cumulative_portfolio_value = []
    dates = []

    for _, row in df.iterrows():
        date = row['Transaction Date']
        action = row['Action']
        symbol = row.get('Symbol', '')
        quantity = float(row.get('Quantity', 0))
        net_amount = float(row.get('Net Amount', 0))

        if action == 'Buy':
            if symbol not in portfolio['positions']:
                portfolio['positions'][symbol] = {'quantity': 0, 'acb': 0}
            position = portfolio['positions'][symbol]
            position['acb'] += abs(net_amount)
            position['quantity'] += quantity
        elif action == 'Sell':
            if symbol in portfolio['positions']:
                position = portfolio['positions'][symbol]
                if position['quantity'] >= quantity:
                    proportion = quantity / position['quantity']
                    position['acb'] -= position['acb'] * proportion
                    position['quantity'] -= quantity

        # Calculate portfolio value
        total_value = portfolio['cash']
        for sym, pos in portfolio['positions'].items():
            total_value += pos['quantity'] * pos['acb']  # Simplified for now
        cumulative_portfolio_value.append(total_value)
        dates.append(date)

        portfolio['history'].append({
            'date': date,
            'cash': portfolio['cash'],
            'positions': {
                sym: {'quantity': pos['quantity'], 'acb': pos['acb']}
                for sym, pos in portfolio['positions'].items()
            }
        })

    return portfolio['history'], {
        'cumulative_portfolio_value': cumulative_portfolio_value,
        'dates': dates
    }