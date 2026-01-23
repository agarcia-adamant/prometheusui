#!/usr/bin/env python3
"""
Lead Data Cleaner
Cleans and normalizes Google Maps scrape CSV exports for the Prometheus leads driver.
"""

import pandas as pd
import re
from pathlib import Path

# Fixed column mappings
FIXED_COLUMNS = {
    'qBF1Pd': 'name',
    'MW4etd': 'rating',
    'UY7F9': 'review_count',
    'W4Efsd': 'business_type',
    'UsdlK': 'phone',
    'hfpxzc href': 'maps_url',
}

# Columns to check for address/hours (order matters)
VARIABLE_COLUMNS = ['W4Efsd 2', 'W4Efsd 3', 'W4Efsd 4', 'W4Efsd 5', 'W4Efsd 6', 'W4Efsd 7']

# Columns to keep in final output
KEEP_COLUMNS = ['name', 'phone', 'address', 'rating', 'review_count', 'business_type', 'hours']

# Patterns
ADDRESS_PATTERN = re.compile(r'\d+\s+\w+.*(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|way|lane|ln|court|ct|place|pl|circle|cir)', re.I)
HOURS_PATTERN = re.compile(r'(open|close|24 hours|\d+\s*(am|pm))', re.I)
SKIP_VALUES = {'·', '·', '', 'nan', 'None'}


def clean_phone(phone: str) -> str:
    """Normalize phone number to digits only with optional + prefix."""
    if pd.isna(phone) or not phone:
        return ''
    cleaned = re.sub(r'[^\d+]', '', str(phone))
    return cleaned


def clean_rating(rating: str) -> float | None:
    """Extract numeric rating value."""
    if pd.isna(rating) or not rating:
        return None
    try:
        return float(str(rating).strip())
    except ValueError:
        return None


def clean_review_count(count: str) -> int | None:
    """Extract numeric review count from format like '(193)' or '(10,285)'."""
    if pd.isna(count) or not count:
        return None
    cleaned = re.sub(r'[(),\s]', '', str(count))
    try:
        return int(cleaned)
    except ValueError:
        return None


def clean_text(text: str) -> str:
    """Clean generic text field."""
    if pd.isna(text) or not text:
        return ''
    return str(text).strip()


def is_skip_value(val: str) -> bool:
    """Check if value should be skipped (empty, separator, etc.)."""
    if pd.isna(val):
        return True
    cleaned = str(val).strip()
    return cleaned in SKIP_VALUES or cleaned == ''


def extract_address_and_hours(row: pd.Series, variable_cols: list) -> tuple[str, str]:
    """
    Extract address and hours from variable columns.
    Returns (address, hours) tuple.
    """
    address = ''
    hours = ''
    
    for col in variable_cols:
        if col not in row.index:
            continue
        val = row[col]
        if is_skip_value(val):
            continue
            
        val_str = str(val).strip()
        
        # Check if it looks like an address
        if not address and ADDRESS_PATTERN.search(val_str):
            address = val_str
            continue
        
        # Check if it looks like hours
        if not hours and HOURS_PATTERN.search(val_str):
            hours = val_str
            continue
        
        # If we don't have address yet and it's not hours-like, assume it's address
        if not address and not HOURS_PATTERN.search(val_str):
            address = val_str
    
    return address, hours


def process_csv(input_path: Path, output_path: Path) -> dict:
    """
    Process a single CSV file: clean, rename columns, and save.
    Returns stats about the processing.
    """
    print(f"\n{'='*60}")
    print(f"Processing: {input_path.name}")
    print('='*60)
    
    # Read CSV
    df = pd.read_csv(input_path, dtype=str)
    original_count = len(df)
    print(f"Original rows: {original_count}")
    print(f"Original columns: {list(df.columns)}")
    
    # Determine which variable columns exist
    existing_var_cols = [c for c in VARIABLE_COLUMNS if c in df.columns]
    print(f"Variable columns to scan: {existing_var_cols}")
    
    # Process each row
    processed_rows = []
    for _, row in df.iterrows():
        # Extract fixed columns
        new_row = {}
        for orig_col, new_col in FIXED_COLUMNS.items():
            if orig_col in row.index:
                new_row[new_col] = row[orig_col]
        
        # Extract address and hours from variable columns
        address, hours = extract_address_and_hours(row, existing_var_cols)
        new_row['address'] = address
        new_row['hours'] = hours
        
        processed_rows.append(new_row)
    
    # Create new DataFrame
    df = pd.DataFrame(processed_rows)
    
    # Apply cleaning functions
    if 'phone' in df.columns:
        df['phone'] = df['phone'].apply(clean_phone)
    
    if 'rating' in df.columns:
        df['rating'] = df['rating'].apply(clean_rating)
    
    if 'review_count' in df.columns:
        df['review_count'] = df['review_count'].apply(clean_review_count)
    
    for col in ['name', 'address', 'business_type', 'hours']:
        if col in df.columns:
            df[col] = df[col].apply(clean_text)
    
    # Filter: must have phone and name
    df = df[df['phone'].apply(lambda x: len(str(x)) > 0 if pd.notna(x) else False)]
    df = df[df['name'].apply(lambda x: len(str(x)) > 0 if pd.notna(x) else False)]
    
    # Keep only relevant columns
    final_cols = [c for c in KEEP_COLUMNS if c in df.columns]
    df = df[final_cols]
    
    # Drop duplicates by phone
    df = df.drop_duplicates(subset=['phone'], keep='first')
    
    # Reset index
    df = df.reset_index(drop=True)
    
    final_count = len(df)
    print(f"Final rows: {final_count}")
    print(f"Final columns: {list(df.columns)}")
    print(f"Removed: {original_count - final_count} rows")
    
    # Preview
    print("\nSample data:")
    print(df.head(5).to_string())
    
    # Save
    df.to_csv(output_path, index=False)
    print(f"\nSaved to: {output_path}")
    
    return {
        'input': input_path.name,
        'output': output_path.name,
        'original_rows': original_count,
        'final_rows': final_count,
        'columns': final_cols
    }


def main():
    """Process all CSV files in raw data directory."""
    # Setup paths
    backend_dir = Path(__file__).parent
    raw_dir = backend_dir / 'data' / 'raw'
    cleaned_dir = backend_dir / 'data' / 'cleaned'
    
    # Also check frontend data directory for existing files
    frontend_data = backend_dir.parent / 'frontend' / 'src' / 'data'
    
    # Ensure directories exist
    raw_dir.mkdir(parents=True, exist_ok=True)
    cleaned_dir.mkdir(parents=True, exist_ok=True)
    
    # Find CSV files
    csv_files = list(raw_dir.glob('*.csv'))
    
    # Also process files from frontend if raw is empty
    if not csv_files and frontend_data.exists():
        csv_files = list(frontend_data.glob('*.csv'))
        print(f"No files in {raw_dir}, using files from {frontend_data}")
    
    if not csv_files:
        print("No CSV files found to process.")
        print(f"Please place CSV files in: {raw_dir}")
        return
    
    print(f"Found {len(csv_files)} CSV file(s) to process")
    
    # Process each file
    results = []
    for csv_path in csv_files:
        output_name = csv_path.stem.replace(' ', '_').lower() + '_cleaned.csv'
        output_path = cleaned_dir / output_name
        
        try:
            stats = process_csv(csv_path, output_path)
            results.append(stats)
        except Exception as e:
            print(f"Error processing {csv_path}: {e}")
            import traceback
            traceback.print_exc()
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for r in results:
        print(f"  {r['input']}: {r['original_rows']} -> {r['final_rows']} rows")
    
    total_in = sum(r['original_rows'] for r in results)
    total_out = sum(r['final_rows'] for r in results)
    print(f"\nTotal: {total_in} -> {total_out} leads")
    print(f"Cleaned files saved to: {cleaned_dir}")


if __name__ == '__main__':
    main()
