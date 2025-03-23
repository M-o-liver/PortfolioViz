import logging
import azure.functions as func
import pandas as pd
import yfinance as yf
import json
from io import StringIO
from datetime import datetime, timedelta

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    
    try:
        file = req.files.get('file')
        if not file:
            return func.HttpResponse("No file uploaded", status_code=400)
        
        # Read and parse CSV
        content = file.read().decode('utf-8')
        df = pd.read_csv(StringIO(content))
        
        # Validate columns
        required_cols = ['Transaction Date', 'Action', 'Symbol', 'Quantity', 
                        'Price', 'Net Amount', 'Currency']
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            return func.HttpResponse(f"Missing columns: {', '.join(missing)}", 
                                   status_code=400)
        
        # Process transactions
        result = process_transactions(df)
        return func.HttpResponse(json.dumps(result), mimetype="application/json")
    
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return func.HttpResponse(f"Error processing file: {str(e)}", 
                               status_code=500)

# [Previous imports and main function remain the same]

def process_transactions(df):
    df['Transaction Date'] = pd.to_datetime(df['Transaction Date'])
    df = df.sort_values('Transaction Date')
    
    portfolio = {
        'cash': 0.0,
        'positions': {},
        'fx_rates': {'USD': 1.3},
        'history': []
    }
    
    result = {
        'dates': [],
        'acb_values': [],
        'market_values': [],
        'positions': [],
        'fx_rates': []
    }

    for _, row in df.iterrows():
        date_str = row['Transaction Date'].strftime('%Y-%m-%d')
        
        # Process transaction
        if row['Action'] == 'FXT':
            handle_fx_conversion(row, portfolio)
        else:
            process_transaction(row, portfolio)
        
        # Update portfolio value
        update_portfolio_value(portfolio, result, date_str)
    
    return result

def process_transaction(row, portfolio):
    symbol = row['Symbol'] or 'CASH'
    action = row['Action']
    quantity = float(row['Quantity'])
    price = float(row['Price'])
    amount = float(row['Net Amount'])
    currency = row['Currency']
    
    # Convert to CAD
    fx_rate = portfolio['fx_rates'].get(currency, 1.0)
    cad_amount = abs(amount) * fx_rate
    
    if action in ['Buy', 'CON', 'DEP']:
        if symbol == 'CASH':
            portfolio['cash'] += cad_amount
        else:
            if symbol not in portfolio['positions']:
                portfolio['positions'][symbol] = {
                    'quantity': 0.0,
                    'acb': 0.0,
                    'transactions': []
                }
            position = portfolio['positions'][symbol]
            position['quantity'] += abs(quantity)
            position['acb'] += cad_amount
            position['transactions'].append({
                'date': row['Transaction Date'].strftime('%Y-%m-%d'),
                'quantity': quantity,
                'price': price,
                'amount': cad_amount
            })
    elif action == 'Sell':
        if symbol in portfolio['positions']:
            position = portfolio['positions'][symbol]
            sell_quantity = min(abs(quantity), position['quantity'])
            acb_portion = (position['acb'] / position['quantity']) * sell_quantity
            position['quantity'] -= sell_quantity
            position['acb'] -= acb_portion
            portfolio['cash'] += cad_amount
            if position['quantity'] <= 0:
                del portfolio['positions'][symbol]
    elif action == 'DIV':
        portfolio['cash'] += cad_amount

def update_portfolio_value(portfolio, result, date_str):
    # Calculate ACB
    acb = portfolio['cash'] + sum(pos['acb'] for pos in portfolio['positions'].values())
    
    # Calculate market value
    market_value = portfolio['cash']
    for symbol, pos in portfolio['positions'].items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period='1d', start=date_str, end=date_str)
            price = hist['Close'].iloc[0] if not hist.empty else pos['acb']/pos['quantity']
        except:
            price = pos['acb']/pos['quantity']
        market_value += pos['quantity'] * price
    
    # Update results
    result['dates'].append(date_str)
    result['acb_values'].append(round(acb, 2))
    result['market_values'].append(round(market_value, 2))
    result['positions'].append({
        sym: {'quantity': p['quantity'], 'acb': p['acb']} 
        for sym, p in portfolio['positions'].items()
    })
    result['fx_rates'].append(portfolio['fx_rates'].copy())

def handle_fx(row, portfolio):
    desc = row['Description']
    net_amount = float(row['Net Amount'])
    
    if 'CAD/USD' in desc:
        # Example: Converting CAD to USD
        cad_amount = abs(net_amount)
        usd_amount = abs(float(row['Gross Amount']))
        portfolio['fx_rates']['USD'] = cad_amount / usd_amount
    elif 'USD/CAD' in desc:
        # Example: Converting USD to CAD
        usd_amount = abs(net_amount)
        cad_amount = abs(float(row['Gross Amount']))
        portfolio['fx_rates']['USD'] = cad_amount / usd_amount

def handle_buy(row, cad_amount, portfolio):
    symbol = row['Symbol'] or 'CASH'
    
    if symbol == 'CASH':
        portfolio['cash'] += cad_amount
        return
    
    price = float(row['Price'])
    quantity = float(row['Quantity'])
    
    if symbol not in portfolio['positions']:
        portfolio['positions'][symbol] = {
            'quantity': 0.0,
            'acb': 0.0,
            'transactions': []
        }
    
    position = portfolio['positions'][symbol]
    position['quantity'] += quantity
    position['acb'] += cad_amount
    position['transactions'].append({
        'date': row['Transaction Date'].strftime('%Y-%m-%d'),
        'quantity': quantity,
        'price': price,
        'amount': cad_amount
    })

def handle_sell(row, cad_amount, portfolio):
    symbol = row['Symbol']
    if symbol not in portfolio['positions']:
        return
    
    quantity = float(row['Quantity'])
    position = portfolio['positions'][symbol]
    
    if quantity > position['quantity']:
        quantity = position['quantity']
    
    # Calculate ACB to remove
    acb_per_share = position['acb'] / position['quantity']
    acb_removed = acb_per_share * quantity
    
    position['quantity'] -= quantity
    position['acb'] -= acb_removed
    portfolio['cash'] += cad_amount
    
    # Remove position if empty
    if position['quantity'] <= 0:
        del portfolio['positions'][symbol]

def update_history(portfolio, response_data, date):
    # Calculate total ACB
    total_acb = portfolio['cash'] + sum(
        pos['acb'] for pos in portfolio['positions'].values()
    )
    
    # Calculate market value
    market_value = portfolio['cash']
    for symbol, pos in portfolio['positions'].items():
        try:
            # Get historical price for that date
            ticker = yf.Ticker(symbol)
            hist = ticker.history(
                start=datetime.strptime(date, '%Y-%m-%d') - timedelta(days=7),
                end=datetime.strptime(date, '%Y-%m-%d') + timedelta(days=1),
                interval='1d'
            )
            price = hist['Close'].iloc[-1] if not hist.empty else pos['acb'] / pos['quantity']
        except Exception as e:
            price = pos['acb'] / pos['quantity']  # Fallback to ACB price
        
        market_value += pos['quantity'] * price
    
    # Update response data
    response_data['dates'].append(date)
    response_data['acb_values'].append(round(total_acb, 2))
    response_data['market_values'].append(round(market_value, 2))
    response_data['fx_history'].append(portfolio['fx_rates'].copy())
    response_data['positions'].append({
        sym: {'quantity': pos['quantity'], 'acb': pos['acb']}
        for sym, pos in portfolio['positions'].items()
    })