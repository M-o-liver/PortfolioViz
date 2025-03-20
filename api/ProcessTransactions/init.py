def process_transactions(df):
    # Ensure date columns are datetime objects
    df['Transaction Date'] = pd.to_datetime(df['Transaction Date'])
    
    # Sort by transaction date
    df = df.sort_values('Transaction Date')
    
    # Initialize portfolio tracking
    portfolio = {
        'cash': 0,
        'positions': {},
        'history': [],
    }
    
    # Initialize statistics
    stats = {
        'totalContributions': 0,
        'contributionCount': 0,
        'totalDividends': 0,
        'dividendCount': 0,
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
    for date in date_range:
        day_transactions = df[df['Transaction Date'].dt.date == date.date()]
        
        if not day_transactions.empty:
            for _, row in day_transactions.iterrows():
                action = row['Action']
                symbol = row['Symbol'] if pd.notna(row['Symbol']) else ''
                quantity = float(row['Quantity']) if pd.notna(row['Quantity']) else 0
                net_amount = float(row['Net Amount']) if pd.notna(row['Net Amount']) else 0
                
                if action == 'CON':
                    portfolio['cash'] += abs(net_amount)
                    stats['totalContributions'] += abs(net_amount)
                    stats['contributionCount'] += 1
                
                elif action == 'DIV':
                    portfolio['cash'] += net_amount
                    stats['totalDividends'] += net_amount
                    stats['dividendCount'] += 1
                
                elif action in ['Buy', 'Sell']:
                    portfolio['cash'] -= net_amount
                    
                    if symbol not in portfolio['positions']:
                        portfolio['positions'][symbol] = 0
                    
                    if action == 'Buy':
                        portfolio['positions'][symbol] += quantity
                    elif action == 'Sell':
                        portfolio['positions'][symbol] -= quantity
                    
                    if price > 0:
                        latest_prices[symbol] = price
        
        position_values = {
            sym: qty * latest_prices.get(sym, 0)
            for sym, qty in portfolio['positions'].items()
            if qty > 0
        }
        
        total_value = portfolio['cash'] + sum(position_values.values())
        
        portfolio['history'].append({
            'date': date,
            'cash': portfolio['cash'],
            'positions': portfolio['positions'].copy(),
            'position_values': position_values.copy(),
            'total_value': total_value,
        })
    
    # Calculate final statistics for allocation and total return
    current_value = sum(
        qty * latest_prices.get(sym, 0)
        for sym, qty in portfolio['positions'].items()
    ) + portfolio['cash']
    
    allocation = [
        {
            'symbol': sym,
            'percentage': (qty * latest_prices.get(sym, 0)) / current_value * 100,
            'color': get_color_for_symbol(sym),
        }
        for sym, qty in portfolio['positions'].items()
        if qty > 0
    ]
    
    total_return = ((current_value - stats["totalContributions"]) / stats["totalContributions"]) * 100
    
    return {
        "history": portfolio["history"],
        "stats": {
            "currentValue": current_value,
            "totalReturn": total_return,
            "totalContributions": stats["totalContributions"],
            "contributionCount": stats["contributionCount"],
            "totalDividends": stats["totalDividends"],
            "dividendCount": stats["dividendCount"],
            "allocation": allocation,
        },
    }


def get_color_for_symbol(symbol):
    """Generate consistent colors for symbols."""
    color_palette = [
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
    ]
    
    return color_palette[hash(symbol) % len(color_palette)]
