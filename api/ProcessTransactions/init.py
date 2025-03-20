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
    latest_prices = {}
    total_contributions = 0
    contribution_count = 0
    
    for _, row in df.iterrows():
        date = row['Transaction Date']
        action = row['Action']
        symbol = row.get('Symbol', '')
        quantity = float(row.get('Quantity', 0))
        price = float(row.get('Price', 0))
        net_amount = float(row.get('Net Amount', 0))
        
        if action == 'CON':
            portfolio['cash'] += abs(net_amount)
            total_contributions += abs(net_amount)
            contribution_count += 1
        elif action == 'WDR':
            portfolio['cash'] -= abs(net_amount)
        elif action in ['Buy', 'Sell']:
            portfolio['cash'] -= net_amount
            if symbol not in portfolio['positions']:
                portfolio['positions'][symbol] = 0
            if action == 'Buy':
                portfolio['positions'][symbol] += quantity
            elif action == 'Sell':
                portfolio['positions'][symbol] -= quantity
            latest_prices[symbol] = price
        
        position_values = {
            sym: qty * latest_prices.get(sym, 0)
            for sym, qty in portfolio['positions'].items() if qty > 0
        }
        
        portfolio['history'].append({
            'date': date,
            'cash': portfolio['cash'],
            'positions': portfolio['positions'].copy(),
            'position_values': position_values,
            'total_value': portfolio['cash'] + sum(position_values.values())
        })
    
    # Calculate asset allocation percentages and total return
    final_total_value = portfolio['history'][-1]['total_value']
    initial_total_value = total_contributions if total_contributions > 0 else final_total_value
    
    allocation = [
        {
            "symbol": symbol,
            "percentage": (value / final_total_value) * 100 if final_total_value > 0 else 0,
            "value": value
        }
        for symbol, value in position_values.items()
    ]
    
    summary_data = {
        "currentValue": final_total_value,
        "totalContributions": total_contributions,
        "contributionCount": contribution_count,
        "totalReturn": ((final_total_value - initial_total_value) / initial_total_value) * 100 if initial_total_value > 0 else 0,
        "allocation": allocation
    }
    
    return portfolio['history'], summary_data
