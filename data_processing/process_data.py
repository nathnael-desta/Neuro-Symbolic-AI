# data_processing/process_data.py
import pandas as pd
import numpy as np
import os
import json

def sanitize_for_prolog(text):
    if not isinstance(text, str):
        return text
    clean_text = text.lower()
    clean_text = clean_text.replace(' ', '_').replace('-', '_')
    clean_text = clean_text.replace("'", "\\'")
    return clean_text

def format_prolog_list(py_list):
    formatted_items = [f"'{item}'" for item in py_list]
    return f"[{', '.join(formatted_items)}]"

def write_prolog_facts(df, output_path: str):
    print(f"--- Writing Prolog facts to: {output_path} ---")
    with open(output_path, 'w') as f:
        f.write("% Auto-generated from associations.tsv\n\n")
        for _, row in df.iterrows():
            p_value = row['p_value_log']
            p_value_str = 'na' if pd.isna(p_value) else str(p_value)
            fact = (
                f"association("
                f"{row['pmid']}, "
                f"'{row['snp']}', "
                f"{format_prolog_list(row['categories'])}, "
                f"'{row['trait']}', "
                f"{p_value_str}"
                f").\n"
            )
            f.write(fact)
    print(f"--- Successfully wrote {len(df)} facts. ---")

def save_unique_vocab(df, col_name, output_path):
    """Saves a unique, sorted list of items from a column to a text file."""
    unique_items = sorted(df[col_name].unique())
    with open(output_path, 'w') as f:
        for item in unique_items:
            f.write(f"{item}\n")
    print(f"--- Saved {len(unique_items)} unique {col_name}s to {output_path} ---")

def get_unique_categories_from_df(df):
    """Extracts all unique categories from the 'categories' list column."""
    all_cats = set()
    df['categories'].apply(lambda cats: all_cats.update(cats))
    return sorted(list(all_cats))

def save_unique_categories(categories, output_path):
    with open(output_path, 'w') as f:
        for cat in categories:
            f.write(f"{cat}\n")
    print(f"--- Saved {len(categories)} unique categories to {output_path} ---")
    
# --- NEW FUNCTION: Create and save the relationship map ---
def save_kb_map(df, output_path: str):
    """Creates and saves the category-to-vocab relationship map as a JSON file."""
    print(f"--- Creating and saving knowledge base map to: {output_path} ---")
    kb_map = {'by_category': {}, 'all_snps': [], 'all_traits': [], 'all_categories': []}
    
    # Get all unique items first
    kb_map['all_snps'] = sorted(list(df['snp'].unique()))
    kb_map['all_traits'] = sorted(list(df['trait'].unique()))
    unique_categories = get_unique_categories_from_df(df)
    kb_map['all_categories'] = unique_categories
    
    # Build the 'by_category' relationship map
    for category in unique_categories:
        # Find all rows where the 'categories' list contains the current category
        mask = df['categories'].apply(lambda cats: category in cats)
        filtered_df = df[mask]
        
        # Get the unique snps and traits for this category
        kb_map['by_category'][category] = {
            'snps': sorted(list(filtered_df['snp'].unique())),
            'traits': sorted(list(filtered_df['trait'].unique()))
        }
        
    with open(output_path, 'w') as f:
        json.dump(kb_map, f, indent=2)
    print("--- Knowledge base map successfully saved. ---")


def process_data(input_path: str):
    print(f"--- Starting data processing for: {input_path} ---")
    col_names = ['pmid', 'snp', 'category_trait', 'trait', 'p_value_log']
    df = pd.read_csv(input_path, sep='\t', names=col_names, header=None)
    
    df['p_value_log'] = df['p_value_log'].replace(-1000.0, np.nan)
    df['snp'] = df['snp'].apply(sanitize_for_prolog)
    df['trait'] = df['trait'].apply(sanitize_for_prolog)
    df['categories'] = df['category_trait'].str.split('|').apply(
        lambda cat_list: [sanitize_for_prolog(cat) for cat in cat_list if cat]
    )
    df = df.drop(columns=['category_trait'])
    print("--- Data cleaning and transformation complete. ---")
    return df

if __name__ == '__main__':
    # Define paths
    input_file = './associations.tsv'
    output_dir = './vocab'
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Process data
    processed_dataframe = process_data(input_file)
    
    # Save all outputs
    write_prolog_facts(processed_dataframe, 'data_processing/associations.pl')
    save_unique_vocab(processed_dataframe, 'snp', os.path.join(output_dir, 'unique_snps.txt'))
    save_unique_vocab(processed_dataframe, 'trait', os.path.join(output_dir, 'unique_traits.txt'))
    
    unique_cats = get_unique_categories_from_df(processed_dataframe)
    save_unique_categories(unique_cats, os.path.join(output_dir, 'unique_categories.txt'))
    
    # NEW: Save the efficient kb_map
    save_kb_map(processed_dataframe, os.path.join(output_dir, 'kb_map.json'))