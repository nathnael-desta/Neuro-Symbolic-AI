import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export async function generateHypotheses(topic: string) {
  try {
    const response = await fetch(`${API_URL}/api/v1/generate-hypotheses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.hypotheses;
  } catch (error) {
    console.error("Error generating hypotheses:", error);
    throw error;
  }
}

export async function fetchVocabulary(fileName: 'unique_snps.txt' | 'unique_traits.txt' | 'unique_categories.txt'): Promise<string[]> {
  try {
    const response = await fetch(`/vocab/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}`);
    }
    const text = await response.text();
    return text.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error(`Error fetching vocabulary from ${fileName}:`, error);
    return []; // Return empty array on error
  }
}