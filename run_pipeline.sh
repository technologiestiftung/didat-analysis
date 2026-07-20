#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run the full data pipeline
python scrape_docs.py
python parse_pdfs.py
python analyze.py
python aggregate.py
