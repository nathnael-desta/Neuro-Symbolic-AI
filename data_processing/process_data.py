# data_processing/process_data.py

import pandas as pd
import numpy as np
import os
from itertools import chain

def sanitize_for_prolog(text):
    """Sanitizes a string to be a valid Prolog atom."""
    if not isinstance(text, str):
        return text
    clean_text = text.lower()
    clean_text = clean_text.replace(' ', '_').replace('-', '_')
    clean_text = clean_text.replace("'", "\\'")
    return clean_text

def format_prolog_list(py_list):
    """Formats a Python list into a Prolog list string."""
    formatted_items = [f"'{item}'" for item in py_list]
    return f"[{', '.join(formatted_items)}]"

def write_prolog_facts(df, output_path: str):
    """Iterates through the DataFrame and writes Prolog facts to a file."""
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

def save_vocabulary(df, output_dir: str):
    """Saves unique, sorted lists of traits, SNPs, and categories to text files."""
    print(f"--- Saving vocabulary files to: {output_dir} ---")
    os.makedirs(output_dir, exist_ok=True)

    # Save unique traits
    unique_traits = sorted(df['trait'].unique())
    with open(os.path.join(output_dir, 'unique_traits.txt'), 'w') as f:
        for trait in unique_traits:
            f.write(f"{trait}\n")
    print(f"Saved {len(unique_traits)} unique traits.")

    # Save unique SNPs
    unique_snps = sorted(df['snp'].unique())
    with open(os.path.join(output_dir, 'unique_snps.txt'), 'w') as f:
        for snp in unique_snps:
            f.write(f"{snp}\n")
    print(f"Saved {len(unique_snps)} unique SNPs.")
    
    # Save unique Categories
    all_categories = sorted(list(set(chain.from_iterable(df['categories']))))
    with open(os.path.join(output_dir, 'unique_categories.txt'), 'w') as f:
        for category in all_categories:
            f.write(f"{category}\n")
    print(f"Saved {len(all_categories)} unique categories.")


def process_data(input_path: str):
    """Reads, cleans, and transforms the gene-trait association data."""
    print(f"--- Starting data processing for: {input_path} ---")
    col_names = ['pmid', 'snp', 'category_trait', 'trait', 'p_value_log']
    df = pd.read_csv(input_path, sep='\t', names=col_names, header=None)
    
    df['p_value_log'] = df['p_value_log'].replace(-1000.0, np.nan)
    df['snp'] = df['snp'].apply(sanitize_for_prolog)
    df['trait'] = df['trait'].apply(sanitize_for_prolog)
    df['categories'] = df['category_trait'].str.split('|').apply(
        lambda cat_list: [sanitize_for_prolog(cat) for cat in cat_list if cat and cat.strip()]
    )
    df = df.drop(columns=['category_trait'])
    print("--- Data cleaning and transformation complete. ---")
    return df

if __name__ == '__main__':
    input_file = 'associations.tsv'
    prolog_output_file = 'associations.pl'
    vocab_output_dir = 'vocab'
    
    # Process the raw data
    processed_dataframe = process_data(input_file)
    
    # Write the Prolog knowledge base
    write_prolog_facts(processed_dataframe, prolog_output_file)
    
    # NEW: Save the vocabulary files for the LLM
    save_vocabulary(processed_dataframe, vocab_output_dir)
