# data_processing/process_data.py

import pandas as pd
import numpy as np

def sanitize_for_prolog(text):
    if not isinstance(text, str):
        return text
    clean_text = text.lower()
    clean_text = clean_text.replace(' ', '_').replace('-', '_')
    clean_text = clean_text.replace("'", "\\'")
    return clean_text

def format_prolog_list(py_list):
    """Formats a Python list into a Prolog list string."""
    # Ensure every item is a single-quoted atom
    formatted_items = [f"'{item}'" for item in py_list]
    return f"[{', '.join(formatted_items)}]"

def write_prolog_facts(df, output_path: str):
    """Iterates through the DataFrame and writes Prolog facts to a file."""
    print(f"--- Writing Prolog facts to: {output_path} ---")
    with open(output_path, 'w') as f:
        f.write("% Auto-generated from associations.tsv\n\n")
        for _, row in df.iterrows():
            # Handle NaN p-values by converting them to the Prolog atom 'na'
            p_value = row['p_value_log']
            if pd.isna(p_value):
                p_value_str = 'na'
            else:
                p_value_str = str(p_value)

            # Format the fact according to the specified structure
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


def process_data(input_path: str):
    print(f"--- Starting data processing for: {input_path} ---")
    col_names = ['pmid', 'snp', 'category_trait', 'trait', 'p_value_log']
    df = pd.read_csv(input_path, sep='\t', names=col_names, header=None)
    print(f"Successfully loaded {len(df)} raw records.")

    df['p_value_log'] = df['p_value_log'].replace(-1000.0, np.nan)
    df['snp'] = df['snp'].apply(sanitize_for_prolog)
    df['trait'] = df['trait'].apply(sanitize_for_prolog)
    df['categories'] = df['category_trait'].str.split('|').apply(
        lambda cat_list: [sanitize_for_prolog(cat) for cat in cat_list]
    )
    df = df.drop(columns=['category_trait'])
    print("--- Data cleaning and transformation complete. ---")
    return df

if __name__ == '__main__':
    input_file = 'associations.tsv'
    output_file = 'associations.pl'
    
    processed_dataframe = process_data(input_file)
    write_prolog_facts(processed_dataframe, output_file)